const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const lodash = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-henry:Test123@todolist-pc3t2.mongodb.net/todolistDB", { useUnifiedTopology: true, useNewUrlParser: true, useCreateIndex: true  , useFindAndModify: false});

const itemSchema = new mongoose.Schema ({
  name: String
});

const Item = mongoose.model("Item", itemSchema);

const startProject = new Item ({
  name: "Start on portfolio!"
});

const doProject = new Item ({
  name: "Do the steps required!"
});

const finishProject = new Item ({
  name: "Finish it!"
});

const defaultItems = [startProject, doProject, finishProject];

const listSchema = new mongoose.Schema ({
  name: String,
  items: [itemSchema]
});

const List = mongoose.model("List", listSchema);

let endDefaultSend = 0;

app.get("/", function(req, res) {
  Item.find({}, function(err, foundItems){
    if(!err){
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  });

});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const initialListName = lodash.capitalize(req.body.list);

  const itemDocument = new Item ({
    name: itemName
  });

  if (initialListName === "Today"){
    itemDocument.save();
    res.redirect("/");
  }else{
    List.findOne({name: initialListName}, function(err, listResult){
      listResult.items.push(itemDocument);
      listResult.save();
      res.redirect("/" + initialListName);
    });
  }

});

app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = lodash.capitalize(req.body.listName);

  if (listName === "Today"){
    Item.findByIdAndRemove(checkedItemId, function(err){
      if (!err) {
        console.log("Succesfully removed the item with id");
        res.redirect("/");
      }else{
        console.log(err);
      }
    });
  }else{
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, listResult){
      if(err){
        console.log(err);
      }else{
        res.redirect("/" + listName);
      }
    });
  }


});

app.get("/about", function(req, res){
  res.render("about");
});

let port = process.env.PORT;
if(port == null || port == ""){
  port = 3000;
}

app.listen(port, function() {
  console.log("Server started succesfully");
});

app.get("/:listName", function(req, res){
  const listName = lodash.capitalize(req.params.listName);
  if(listName == "about"){
    res.redirect("/about");
  }else{
    List.findOne({name: listName}, function(err, listResult){
      if(!err){
        if(!listResult){
          //create a new list
          const list = new List({
            name: listName,
            items: []
          });

          list.save();
          res.redirect("/" + listName);
        }else if(listName.name == "favicon.ico"){
          List.deleteOne({name: listName.name}, function(err){
            if(err){
              console.log(err);
            }
          });
        }else{
          //show existing list
          res.render("list", {listTitle: listName, newListItems: listResult.items});
        }
      }

    });
  }
});
