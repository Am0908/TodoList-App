//jshint eversion:6

const express = require("express");
const bodyparser = require("body-parser");
const mongoose = require("mongoose");
const _=require("lodash");

const app = express();
const items=[];
const workItems =[];
app.set("view engine", "ejs");

app.use(bodyparser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://cluster0.hvctvpc.mongodb.net/todolistDB");
const itemSchema = new mongoose.Schema({
  name: String
});
const Item = mongoose.model("Item", itemSchema);

const item1 = new Item({name: "Welcome to your todolist."});
const item2 = new Item({name: "Hit the + button to add a new item."});
const item3 = new Item({name: "<-- Hit this to delete an item."});
const defaultitems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {


  Item.find({}, function(err, foundItems){

    if(foundItems.length===0){
      Item.insertMany(defaultitems, function(err) {
          if(err)
          {
            console.log(err);
          }
          else{
            console.log("successfully saved all the items to todolistDB");
          }
      });
      res.redirect("/");
    }

    else{
      res.render("list", {
        listTitle: "Today",
        newListItems: foundItems
      });
    }
  });

});

app.get("/:customListName", function(req, res){
    const customListName = _.capitalize(req.params.customListName);

    List.findOne({name: customListName}, function(err, foundList){
      if(!err){
        if(!foundList){
          // create a new list
          const list = new List({
            name: customListName,
            items: defaultitems
          });
          list.save();
          res.redirect("/" + customListName);
        }
        else {
          //show an existing list
          res.render("list", {listTitle: foundList.name ,newListItems: foundList.items});
        }
      }
    });
});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemName
  });

  if(listName == "Today"){
    item.save();
    res.redirect("/")
  }
  else {
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
  //
  // if(req.body.list === "Work")
  // {
  //   workItems.push(item);
  //   res.redirect("/work");
  // }
  // else
  // {
  //   items.push(item);
  //   res.redirect("/");
  // }

});

app.get("/work", function(req, res){
  res.render("list", {listTitle: "Work List", newListItems: workItems});
});

app.get("/about", function(req, res){
  res.render("about");
});

app.post("/delete", function(req, res){
  const checkItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today")
  {
  Item.findByIdAndRemove(checkItemId, function(err){
    if(!err){
      console.log("Removed the item successfully");
      res.redirect("/");
    }
    });
  }
    else{
      List.findOneAndUpdate({name: listName}, {$pull: {items: { _id: checkItemId}}}, function(err, foundList){
          if(!err){
            res.redirect("/" + listName);
          }
      })
    }
    });

app.post("/work", function(req, res){
  let item = req.body.newItem;
  workItems.push(item);
  res.redirect("/work");
});

let port = process.env.PORT;
if(port==null || port==""){
  port=3000;
}
app.listen(port, function(){
  console.log("server has started successfully.");
});
