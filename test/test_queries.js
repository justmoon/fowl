"use strict";

var fowler = require('../index');
var chai = require('chai');
var Promise = require('bluebird');

var expect = chai.expect;

var root = '__tests__';

fowler.open();

describe("Queries", function(){

  beforeEach(function(){
    return fowler.transaction(function(tr){
      tr.remove('__ind');
      tr.remove(root);
      tr.remove('animals');
      tr.remove('people');
      tr.remove('tests');
    });
  });

  after(function(){
    return fowler.transaction(function(tr){
      tr.remove('animals');
      tr.remove('people');
      tr.remove(root);
      tr.remove(['__ind', root]);
    });
  });

  describe("Equality condition", function(){
    it("Find by filtering some property", function(){
      return fowler.transaction(function(tr){
        tr.create([root, 'people'], { name: "John", lastname: "Smith", balance: 50});
        tr.create([root, 'people'], { name: "Lisa", balance: 30});

        return tr.find([root, 'people'], {name: "John"}, ['name']).then(function(result){
          expect(result).to.be.an('array');
        });
      });
    });

    it("Find one between many documents by filtering some property", function(){
      return fowler.transaction(function(tr){
        //
        // Add many documents
        //
        tr.create([root, 'people'], { name: "Peter", balance: 30});
        tr.create([root, 'people'], { name: "Peter", balance: 45});

        for(var i=0; i< 1000; i++){
          tr.create([root, 'people'], { id: i, name: "John", lastname: "Smith", balance: Math.random()});
        }
      }).then(function(){
        //
        // Lets find Lisa
        //
        return fowler.transaction(function(tr){
          return tr.find([root, 'people'], {name: "Peter", balance: 30}, ['name', 'balance']);
        }).then(function(result){
          expect(result).to.be.a("array");
          expect(result).to.have.length(1);
          expect(result[0]).to.have.property('balance');
          expect(result[0].balance).to.be.equal(30);
          expect(result[0]).to.have.property('name');
          expect(result[0].name).to.be.equal("Peter");
        });
      });
    });

    it("Find by specifying AND conditions");
    it("Find by specifying OR conditions");
    it("Find by specifying AND and OR conditions");

    it("Find by specifying a subdocument");

    it("Find by exact match on array { tags: [ 'fruit', 'food', 'citrus' ]");
    it("Find by matching one array element {tags: 'fruit' }");

    it("Find one between many documents using an indexed property", function(){
      var keyPath = [root, 'indexedpeople'];

      return fowler.addIndex(keyPath, 'name').then(function(){
        return fowler.transaction(function(tr){
          //
          // Add many documents
          //
          tr.create(keyPath, { name: "Peter", balance: 30});

          for(var i=0; i< 1000; i++){
            tr.create(keyPath, { id: i, name: "John", lastname: "Smith", balance: Math.random()});
          }

          return tr.find(keyPath, {name: "Peter"}, ['name', 'balance']);
        }).then(function(result){
          expect(result).to.be.a("array");
          expect(result).to.have.length(1);
          expect(result[0]).to.have.property('balance');
          expect(result[0].balance).to.be.equal(30);
          expect(result[0]).to.have.property('name');
          expect(result[0].name).to.be.equal("Peter");
        });
      });
    });
  });

  describe("Condition Operators", function(){
    it("equality operator", function(){
      var keyPath = [root, 'people'];

      return fowler.transaction(function(tr){
        //
        // Add many documents
        //
        tr.create(keyPath, { name: "Josh", balance: 30});
        tr.create(keyPath, { name: "Josh", balance: 45});

        for(var i=0; i< 50; i++){
          tr.create(keyPath, {
            _id: i,
            name: "John",
            lastname: "Smith",
            balance: Math.round(Math.random()*100)
          });
        }
      }).then(function(){
        var time = Date.now();
        return fowler.transaction(function(tr){
          var query = fowler.query(keyPath);

          query
            .eql('name', 'Josh')
            .eql('balance', 30)

          return query.exec(tr);
        }).then(function(docs){
          expect(docs).to.have.length(1)
          expect(docs[0]).to.have.property('name', 'Josh');
          expect(docs[0]).to.have.property('balance', 30);
        });
      });
    });

    it("equality operator using index", function(){
      var keyPath = [root, 'eqlindex', 'people'];

      return fowler.addIndex(keyPath, 'balance').then(function(){

        return fowler.transaction(function(tr){
          //
          // Add many documents
          //
          tr.create(keyPath, { name: "Josh", balance: 30});
          tr.create(keyPath, { name: "Josh", balance: 45});

          for(var i=0; i< 50; i++){
            tr.create(keyPath, {
              _id: i,
              name: "John",
              lastname: "Smith",
              balance: Math.round(Math.random()*100)
            });
          }
        }).then(function(){
          var time = Date.now();
          return fowler.transaction(function(tr){
            var query = fowler.query(keyPath);

            query
              .eql('balance', 30)
              .eql('name', 'Josh')

            return query.exec(tr);
          }).then(function(docs){
            expect(docs).to.have.length(1)
            expect(docs[0]).to.have.property('name', 'Josh');
            expect(docs[0]).to.have.property('balance', 30);
          });
        });
      });
    });

    it("Greater than", function(){
      var keyPath = [root, 'people'];

      return fowler.transaction(function(tr){
        //
        // Add many documents
        //
        tr.create(keyPath, {name: "Jim", balance: 30});
        tr.create(keyPath, {name: "Jim", balance: 45});

        for(var i=0; i< 50; i++){
          tr.create(keyPath, {
            _id: i,
            name: "John",
            lastname: "Smith",
            balance: Math.round(Math.random()*100)
          });
        }
      }).then(function(){
        var time = Date.now();
        return fowler.transaction(function(tr){
          var query = fowler.query(keyPath);

          query
            .gt('balance', 30)
            .eql('name', 'Jim')

          return query.exec(tr);
        }).then(function(docs){
          expect(docs).to.have.length(1)
          expect(docs[0]).to.have.property('name', 'Jim');
          expect(docs[0]).to.have.property('balance', 45);
        });
      });
    });

    it("Greater or Equal than", function(){
      var keyPath = [root, 'people'];

      return fowler.transaction(function(tr){
        //
        // Add many documents
        //
        for(var i=0; i< 50; i++){
          if (i === 13) {
            tr.create(keyPath, {
              _id: i,
              name: "Joshua",
              balance: 30
            });
          } else if (i === 33) {
            tr.create(keyPath, {
              _id: i,
              name: "Joshua",
              balance: 45
            });
          } else {
            tr.create(keyPath, {
              _id: i,
              name: "John",
              lastname: "Smith",
              balance: Math.round(Math.random()*100)
            });
          }
        }
      }).then(function(){
        var time = Date.now();
        return fowler.transaction(function(tr){
          var query = fowler.query(keyPath);

          query
            .gte('balance', 30)
            .eql('name', 'Joshua')

          return query.exec(tr);
        }).then(function(docs){
          expect(docs).to.have.length(2)
          expect(docs[0]).to.have.property('name', 'Joshua');
          expect(docs[0]).to.have.property('balance', 30);
          expect(docs[1]).to.have.property('name', 'Joshua');
          expect(docs[1]).to.have.property('balance', 45);
        });
      });
    });

    it("Less than", function(){
      var keyPath = [root, 'people'];

      return fowler.transaction(function(tr){
        //
        // Add many documents
        //
        tr.create(keyPath, {name: "Joshua", balance: 30});
        tr.create(keyPath, {name: "Joshua", balance: 45});

        for(var i=0; i< 50; i++){
          tr.create(keyPath, {
            _id: i,
            name: "John",
            lastname: "Smith",
            balance: Math.round(Math.random()*100)
          });
        }
      }).then(function(){
        var time = Date.now();
        return fowler.transaction(function(tr){
          var query = fowler.query(keyPath);

          query
            .lt('balance', 45)
            .eql('name', 'Joshua')

          return query.exec(tr);
        }).then(function(docs){
          expect(docs).to.have.length(1)
          expect(docs[0]).to.have.property('name', 'Joshua');
          expect(docs[0]).to.have.property('balance', 30);
        });
      });
    });

    it("Less or equal than", function(){
      var keyPath = [root, 'people'];

      return fowler.transaction(function(tr){
        //
        // Add many documents
        //

        for(var i=0; i< 50; i++){
          if (i === 13) {
            tr.create(keyPath, {
              _id: i,
              name: "Joshua",
              balance: 30
            });
          } else if (i === 33) {
            tr.create(keyPath, {
              _id: i,
              name: "Joshua",
              balance: 45
            });
          } else {
            tr.create(keyPath, {
              _id: i,
              name: "John",
              lastname: "Smith",
              balance: Math.round(Math.random()*100)
            });
          }
        }
      }).then(function(){
        var time = Date.now();
        return fowler.transaction(function(tr){
          var query = fowler.query(keyPath);

          query
            .lte('balance', 45)
            .eql('name', 'Joshua')

          return query.exec(tr);
        }).then(function(docs){
          expect(docs).to.have.length(2)
          expect(docs[0]).to.have.property('name', 'Joshua');
          expect(docs[0]).to.have.property('balance', 30);
          expect(docs[1]).to.have.property('name', 'Joshua');
          expect(docs[1]).to.have.property('balance', 45);
        });
      });
    });

    it("Not equal ($ne)");
    it("Not in ($nin)");
  });
});
