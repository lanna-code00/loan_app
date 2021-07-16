import { Router } from '@angular/router';
import { LoanService } from './../../Services/loan.service';
import { Component, OnInit } from '@angular/core';
import { OfferloanService } from 'src/app/adminfolder/Servicefolder/offerloan.service';
import { CurrencyPipe } from '@angular/common';

@Component({
  selector: 'app-getloan',
  templateUrl: './getloan.component.html',
  styleUrls: ['./getloan.component.css'],
  providers: [CurrencyPipe]
})
export class GetloanComponent implements OnInit {

  public id = JSON.parse(localStorage.getItem('loggedUser')).user.id;
  public checks = true;
  public text;
  public amount;
  public interest;
  public paybacktime;
  public status;
  public load = false;
  totalamount: any;
  public totalinterest;
  alltotals: any;
  chekuserfund: any;

  constructor(
    public api: LoanService,
    public adminApi: OfferloanService,
    public router: Router,
    public currencypipe: CurrencyPipe
  ) { }

  ngOnInit(): void {
      this.adminApi.getrequests().subscribe((data:any) => {
          let checkstatus = data.find((u) => u.id == this.id);
          if(checkstatus && (checkstatus.status == "pending")){
                this.checks = true;
                this.load = false;
                this.text = "Your current loan application is being reviewed, we will notify you once it is approved.";
                this.amount = checkstatus.amount;
                this.interest = checkstatus.interest;
                this.paybacktime = checkstatus.paybacktime;
                this.status = checkstatus.status;
          } else if(checkstatus && (checkstatus.status == "approved")){
                this.checks = true;
                this.load = false;
                this.text = `Your loan of $${checkstatus.amount}.00 has been approved!`;
                this.amount = checkstatus.amount;
                this.interest = checkstatus.interest;
                this.paybacktime = checkstatus.paybacktime;
                this.status = checkstatus.status;
          }
                else {
                  this.checks = false;
                   this.text = "You have not applied to loan yet!";
                }
      }, error => {
         this.load = false;
      })

      this.adminApi.getrequests().subscribe((data:any) => {
        let myamount = [];
        let mytotal = [];
        let checkstatus = data.filter((u) => u.id == this.id && u.paid_status == "pending");

        checkstatus.map((el) => {
    
           if(el.allocation === "not allocated"){
             let reducer = (acc, cur) => {
               return acc + (Number(cur.amount));
              };
          
              this.totalamount  = checkstatus.reduce(reducer, 0);
           } 
           else if(el.allocation === "allocated"){
              this.totalamount = 0;
              let reducerInterest = (acc, cur) => {
                return acc + (Number(cur.total));
               };
               this.totalinterest = checkstatus.reduce(reducerInterest, 0);
           }
        })

      })
  }

  listofloans(){
    this.api.getfunds().subscribe((data:any) => {
      let user = data.find((u) => u.id == this.id);
      if(!user){
          return;
      } else {
        this.router.navigate(['/sidebar/listofloans']);
      }
    })
  
  }

  getnewLoan(){
    this.api.getfunds().subscribe((data:any) => {
      let mycheck = data.find(u => u.id == this.id);
      if(this.totalinterest >= mycheck.fund){
        console.log("no loan again")
      } else {
        console.log("you can  check in")
      }
    })
    // this.router.navigate(['/sidebar/listofloans']);
  }

  addToBalance(){
    this.load = true;

    this.api.getfunds().subscribe((data:any) => {
      this.chekuserfund = data.find((u) => u.id = this.id);
      
      this.adminApi.getrequests().subscribe((data:any) => {
        let checkstatus = data.filter((u) => u.id == this.id && u.paid_status === "pending");

        checkstatus.map((el) => {

           if(el.allocation === "not allocated"){
                     let edits = {
                       status: 'allocated'
                     }
                     this.adminApi.editallocation(edits, el.randomId).subscribe((data:any) => {
                       if(data){  
                         
                         let reducer = (acc, cur) => {
                        return acc + (Number(cur.amount));
                       };
                       this.totalamount  = checkstatus.reduce(reducer, 0);

                         let totalfundloan = +this.totalamount + +this.chekuserfund.loan;
                         
                         this.api.editfundloan(this.id, {loan: totalfundloan}).subscribe((data:any) => {
                           console.log(data);
                           this.load = false
                           this.totalamount = 0;
                         }, error => {
                           console.log(error);
                           this.load = false
                         })
                       }
                       console.log(data);
                       this.load = false
                     }, error => {
                       console.log(error);
                       this.load = false
                     })
           }

           else if(el.allocation == "allocated") {
               console.log("allocated");
           }
        })

        
    })

    })
  
  }

}
