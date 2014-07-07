$(function () {


  /////////////////
  // Initial setup.
  /////////////////

  //======================
  // Create app namespace:
  //======================
  var app = {};

  // Default objects:
  app.purchases = [];
  app.perfumesCollection;


  //==============================
  // Get the data to be displayed:
  //==============================

  $.getJSON('data/perfumes.json', function(data) {
    // Make acquired data available to templates:
    app.perfumesCollection = app.perfumeGenres.scope.perfumesCollection = data;
    // Render first template:
    app.perfumeGenres.render();
  });



  /////////////////////////////////
  // Initalize the app's templates:
  /////////////////////////////////


  //==============================================
  // Define the templates.
  // This creates templates from all DOM ids which 
  // correspond to Somajs Templates in the DOM,
  // thus enabling calling them later by name
  // without having to define them individually.
  //============================================== 
  ['perfumesGenreTitle', 'available_perfumes', 'perfumeGenres', 'detailNavbar', 'perfumeDetail', 'backToPerfume', 'cart','confirmation'].forEach(function(template) {
      return app[template] = soma.template.create(document.getElementById(template));
  });


  //=================================
  // Define a template helper.
  // Capitalize first letter of word:
  //=================================
  soma.template.helpers({
    capitalize : function ( str ) {
      if (!str) return;
      return str.charAt(0).toUpperCase() + str.slice(1);
    }
  });


  //================================================================
  // Define a method to get the genre of perfume (men, women, kids).
  // This filters the genre from the total perfumes object.
  // Then renders the template on the next screen with that genre.
  //================================================================
  app.perfumeGenres.scope.getGenre = function(item) {
    var title = app.perfumesGenreTitle.scope.title = item.target.getAttribute('data-title');
    var perfumeGenre = item.target.getAttribute('data-genre');
    app.perfumesGenreTitle.render();
    var whichPerfumes = app.perfumesCollection.filter(function(item) {
      return item.genre === perfumeGenre;
    })
    app.available_perfumes.scope.selectedGenre = whichPerfumes[0].data;
    //==========================================
    // Update the template for the chosen genre:
    //==========================================
    app.available_perfumes.render();
    app.available_perfumes.scope.children = $('#available_perfumes').children();
  };


  //================================================
  // Get the chosen perfume and render its template:
  //================================================
  app.available_perfumes.scope.getChosenPerfume = function(e) {
    var item = e.target.nodeName === 'LI' ? e.target : $(e.target).closest('li')[0];
    var sku = item.getAttribute('data-sku');
    var chosenPerfume = app.available_perfumes.scope.selectedGenre.filter(function(perfume) {
       return perfume.sku === sku;
    });

    //=========================
    // Update the navbar title:
    //=========================
    app.detailNavbar.scope.chosenPerfume = chosenPerfume[0];
    app.detailNavbar.scope.chosenPerfume.genreTitle = app.perfumesGenreTitle.scope.title;
    app.detailNavbar.render();

    //========================
    // Update the detail view:
    //========================
    app.perfumeDetail.scope.chosenPerfume = chosenPerfume[0];
    app.perfumeDetail.render();
  };


  //===========================================
  // Calculate how many items have been chosen.
  // This is used in the shopping cart:
  //===========================================
  app.cart.scope.purchases = app.purchases;
  app.cart.scope.disabled = true;
  app.cart.scope.getTotalItems = function() {
    if (!app.cart.scope.purchases.length) return 0;
    else return app.cart.scope.purchases.length;
  };


  //==========================
  // Render Confirmation view:
  //==========================
  app.confirmation.scope.getTotalCost = app.cart.scope.getTotalCost = function() {
    var total = 0;
    app.cart.scope.purchases.forEach(function(item) {
      total += Number(item.wholesale_price);
    });
    return total.toFixed(2);
  };    




  ///////////////////////////
  // Setup User Interactions:
  ///////////////////////////

  //======================
  // Add to Shopping Cart:
  //======================
  $('#addToCart').on('singletap', function() {
    $.UIGoToArticle('#cart');
    // Update cart with added perfume data:
    app.perfumeDetail.scope.chosenPerfume.genreTitle = app.perfumesGenreTitle.scope.title;
    // Render cart template:
    app.cart.scope.purchases.push(app.perfumeDetail.scope.chosenPerfume);
    app.cart.scope.disabled = false;
    app.cart.render();
    // Update 'Back Button' text template:
    app.backToPerfume.scope.perfumeName = app.perfumeDetail.scope.chosenPerfume.product_title;
    app.backToPerfume.render();
  });

  //====================
  // View Shopping Cart:
  //====================
  $('#shoppingCart').on('singletap', function() {
    // If shopping cart is empty, do nothing:
    if (!app.cart.scope.purchases.length) return;
    // Otherwise, go to cart view:
    $.UIGoToArticle('#cart');
  });

  //=============
  // Place Order:
  //=============
  $('#placeOrder').on('singletap', function() {
    // Go to order confirmation view:
    $.UIGoToArticle('#confirmation');
    // Create a uuid for the order:
    $('#confirmationNum').text($.Uuid());
    // Update the confirmation view template:
    app.confirmation.scope.purchases = app.cart.scope.purchases;
    app.confirmation.render();
  });

  //==============
  // Cancel Order:
  //==============
  $('#cancelOrder').on('singletap', function() {
    // Return to the main view:
    $.UIGoBackToArticle('#main');
    // Reset the shopping cart:
    app.cart.scope.purchases = [];
    app.cart.render();
  });   
});