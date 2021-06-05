/*########################################################       PROJECT  STARTING       ########################################################### */
const fs=require("fs");
const puppeteer =require("puppeteer");
const fetch=require('node-fetch');
const cheerio=require("cheerio");
const { argv } = require("process");
const { Console } = require("console");

let product=process.argv.slice(2);
let namelist=[];
let pricelist=[];
let ratinglist=[];
let selectedlinklist=[];
let doc;
let browser;

let id="7838435069";
let pss="0987654321";


async function project(){

 try{

   browser=await puppeteer.launch({
      headless:false,
      defaultViewport:null,
      args:["--start-maximized"]});

   let page=await browser.pages();
   let tab=page[0];

   /*######################################################    LOGIN PAGE OF AMAZON    ######################################################## */

   await tab.goto("https://www.amazon.in/");     
   await tab.waitForTimeout(2000);
   let signin=await tab.$('#nav-tools #nav-link-accountList');
   let signlink=await tab.evaluate(function(ele){return ele.getAttribute("href")},signin);
   await tab.goto(signlink);

   /*#####################################################     LOGIN CREDENTIALS      ##########################################################*/

   await tab.click('#ap_email');
   await tab.type("#ap_email",id);
   await tab.click('.a-button-input'); 
   await tab.waitForSelector('#ap_password');
   await tab.click('#ap_password');
   await tab.type('#ap_password',pss);
   await tab.click('#signInSubmit');
   await tab.waitForTimeout(4000); 

   /*####################################################      SEARCHING PRODUCT       ##########################################################*/

   await tab.click(".nav-search-field #twotabsearchtextbox");
   await tab.type(".nav-search-field #twotabsearchtextbox",product);
   await tab.click('#nav-search-submit-button');
   await tab.waitForTimeout(3000);
   let serialwiselist=await fetchproductlist(tab);
   let alllists=await tab.$$('.a-size-mini.a-spacing-none.a-color-base.s-line-clamp-2 a');

   /*####################################################       SELECTING TOP 5 PRODUCTS    ##################################################*/
   
   for(let i=0;i<5;i++){

       let div=alllists[i];
       let link= await tab.evaluate(function(ele){return ele.getAttribute("href")},div);
       let linkseries="http://www.amazon.in/"+link;
       await fillingproddetails(linkseries,i,serialwiselist); 
       await tab.waitForTimeout(1000);
       await nevigate(browser,linkseries);
   }
 
   await finalselection(tab);
   await tab.close();
   
  }catch(error)
  {
     console.log(error);
  }
 
};
project();

/*###################################################      FETCHING DATA        ############################################################# */

async function fetchproductlist(tab){

   let url=await tab.url();
   let htmld=await fetch(url);
   let res=await htmld.text();
   await fs.promises.writeFile("./load.html",res);
   let loaddata=await fs.promises.readFile("./load.html","utf-8");
   doc=cheerio.load(loaddata);
   let itemlists= doc(".s-result-item.s-asin.sg-col-0-of-12.sg-col-16-of-20.sg-col.sg-col-12-of-16");
   await fs.promises.writeFile("./itemlist.html",itemlists+"");
   return itemlists;

};

/*##################################################       FILLING PRODUCT DETAILS        ###################################################### */

async function fillingproddetails(eachlink,i,serialwiselist){

   let onebyonelist= await doc(serialwiselist[i]);
   let text=await onebyonelist.find('.a-size-medium.a-color-base.a-text-normal');  //items
   let itemname= await text.text();

   let p=await onebyonelist.find(".a-price-whole");   //prices
   let pricetext=await p.text();

   let rat=await onebyonelist.find('.a-icon-alt');   //ratings
   let rattext=await rat.text();
   let actualrating=rattext.split(" ");

   ratinglist.push(actualrating[0]);
   pricelist.push(pricetext);
   selectedlinklist.push(eachlink);
   namelist.push(itemname);

};

/*###############################################           NAVIGATING TO ALL ITEMS     ###################################################### */

async function nevigate(browser,link){

   let newtab =await browser.newPage();
   await newtab.goto(link);   
   await newtab.waitForTimeout(2000);
   await newtab.close();

};

/*###############################################           SELECTING FINAL ITEM       ########################################################### */

async function finalselection(tab){

   let min=pricelist[0];
   let max=ratinglist[0];
   let index1=0;
   let index2=0;

   for(let k=1;k<pricelist.length;k++){
      if(pricelist[k]<min){
      min=pricelist[k];
      index1=k;
      }
   }

   for(let l=1;l<ratinglist.length;l++){
      if(ratinglist[l]>max){
      max=ratinglist[l];
      index2=l; 
      }
   }

   let nt=await browser.newPage();
   await nt.goto(selectedlinklist[index1]);
   await nt.waitForSelector('#add-to-wishlist-button-submit');
   await nt.click('#add-to-wishlist-button-submit');
   await nt.waitForSelector('.a-button-close.a-declarative');
   await nt.waitForTimeout(5000);
   await nt.click('.a-button-close.a-declarative');


   if(index1==index2){   

   console.log("BUYYYYY ITS A GREAT DEAL!!! "+"\n"+namelist[index1]+"\n"+"price  "+pricelist[index1] );
   console.log("PRODUCT IS AVAILABLE AT MINIMUM PRICE AND GREAT RATING!! " );

  }else{
   
   console.log("NOT A GREAT DEAL BUY LATER!!");
   
   }
};

/*#####################################################         COMPLETED        ###################################################################### */










