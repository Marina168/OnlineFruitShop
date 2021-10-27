const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
var fs=require('fs');
var mysql = require('mysql');
var con = mysql.createConnection({
	host: 'localhost',
	user: 'root',
	password: 'root',
	database:'cumparaturi'
  });

const app = express();
app.use(cookieParser());

const port = 6789;

// directorul 'views' va conține fișierele .ejs (html + js executat la server)
app.set('view engine', 'ejs');
// suport pentru layout-uri - implicit fișierul care reprezintă template-ul site-ului este views/layout.ejs
app.use(expressLayouts);
// directorul 'public' va conține toate resursele accesibile direct de către client (e.g., fișiere css, javascript, imagini)
app.use(express.static('public'))
// corpul mesajului poate fi interpretat ca json; datele de la formular se găsesc în format json în req.body
app.use(bodyParser.json());
// utilizarea unui algoritm de deep parsing care suportă obiecte în obiecte
app.use(bodyParser.urlencoded({ extended: true }));

// la accesarea din browser adresei http://localhost:6789/ se va returna textul 'Hello World'
// proprietățile obiectului Request - req - https://expressjs.com/en/api.html#req
// proprietățile obiectului Response - res - https://expressjs.com/en/api.html#res
app.use(session({
	username:'marina',
	password:'ina',
	mesaj:null,
	resave: true,
    saveUninitialized: true,
	secret: 'jghy',
	/*cookie: {
        expires: 600000
    }*/
}));
app.get('/', (req, res) => 
{
	if( con !==0 && req.session.username !==0)
	{
		con.query('SELECT Id, Denumire, Pret FROM produse ',function(err,rows) 
		{
			if (err) throw err;
			res.render('index.ejs',{rows:rows,username: req.session.username});
	
		});
		
	}	
	else
	{
		console.log("Buna");
		res.render('index.ejs',{username : req.session.username});
	}
});

app.get('/adaugare-cos',(req,res)=>
{
	session.cart=[];
	session.cart.push(req.query);	
	//console.log(session.cart);
	res.redirect('/');


});
app.get('/vizualizare-cos',(req,res)=>
{
	rows=[];
	for(let id of session.cart)
	{
		var q= "SELECT * FROM produse WHERE Id="+id.Id
		con.query(q,function(err,result)
		{
			if(err)throw err;
			rows.push(JSON.stringify(result));
			console.log(rows);
		});

	}
	res.render('vizualizare-cos',{rows:rows});
});

app.get('/creare-bd',(req,res)=>
{
	con.connect(function(err) {
		if (err) throw err;
		console.log("Connected!");


		/*con.query("CREATE DATABASE cumparaturi", function (err, result) {
			if (err) throw err;
			console.log("Database created");*/
		/*var sql = "CREATE TABLE produse (Id INT AUTO_INCREMENT PRIMARY KEY, Denumire VARCHAR(255), Pret varchar(10) NOT NULL)";
 		con.query(sql, function (err, result) {
   		if (err) throw err;
    	console.log("Table created");
		});*/
		/*var sql = "DROP TABLE IF EXISTS produse";
		con.query(sql, function (err, result) {
			if (err) throw err;
			console.log(result);
		});*/
		
	  });
	  res.redirect(302,'/');

});
app.get('/inserare-bd',(req,res)=>{

	
		/*var sql = "INSERT INTO produse (Id, Denumire,Pret) VALUES ?";
		var values = [
		  [1, 'Mere',3.3],
		  [2, 'Pere',5.5],
		  [3, 'Ananans',7.0],
		  [4, 'Gutui',3.4],
		  [5, 'Cirese',11.5],
		  [6, 'Capsuni',13]
		];
		con.query(sql, [values], function (err, result) {
		  if (err) throw err;
		  console.log("Number of records inserted: " + result.affectedRows);
		});*/
		res.redirect(302,'/');
});



// la accesarea din browser adresei http://localhost:6789/chestionar se va apela funcția specificată
app.get('/chestionar', (req, res) => {

	const raspunsuri =['0','3','1','0','0','0'];
	fs.readFile('intrebari.json',(err,data)=>
	{
		if(err)throw err;
		const listaIntrebari =JSON.parse(data);
		res.render('chestionar', {intrebari: listaIntrebari});
		app.post('/rezultat-chestionar', (req, res) => {
			res.render('rezultat-chestionar',{raspunsuri: req.body, intrebari:listaIntrebari});
		});
	});

});
//accesare adresei .../autentificare
app.get('/autentificare',(req,res)=>
{
	
	res.render('autentificare',{errorMsg: req.session.mesaj});
	

});
app.get('/delogare',(req,res)=>
{
	
	req.session.username=undefined;
	res.redirect(302,'/');
	

});
app.get('/adaugare-cos',async(req,res)=>
{
	req.session.produse.push(req.query);
	console.log(req.session.produse);
	res.redirect('/');

});



app.post('/verifica-autentificare',(req, res)=>
{
	
	/*var users =[{
		username : "Marina",
		password : "123"
	},
		{username : "Roxana",
		password:"roxi"}
];*/
	var users = [];
	fs.readFile("utilizatori.json",(err,data)=>
	{
		if(err)throw err;
		users = JSON.parse(data);
		console.log(users);
		for(let index=0;index<users.length;++index)
		{
			console.log(req.body.username);
			console.log(req.body.password );

			if(req.body.username === users[index].username)
			{
				if(req.body.password === users[index].password)
				{
					//	res.cookie("autentificare",req.body,{expires:new Date(Date.now()-1)})
					//res.cookie("username",req.body.username);
					req.session.username= req.body.username;
					//res.render('/',{user:req.session.username});
					req.session.mesaj=undefined;
					res.redirect(302,'/')
					return;
				}
				else{
					//res.cookie("mesajEroare","Parola este gresita!");
					req.session.mesaj="Parola este gresita";
					res.redirect(302,"/autentificare")
					return ;
				}		
			}
		}
		//res.cookie("mesajEroare","Utilizatorul nu este corect!")
		req.session.mesaj="Utilizatorul nu este corect!";
		res.redirect(302,"/autentificare");
		
	});
});
app.listen(port, () => console.log(`Serverul rulează la adresa http://localhost:`));
