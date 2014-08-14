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
  app.fragrancesCollection;


  //////////////////////////
  // Define new data events:
  //////////////////////////
  ['tap', 'singletap', 'longtap', 'doubletap', 'swipe', 'swipeleft', 'swiperight', 'swipeup', 'swipedown'].forEach(function(gesture) {
    soma.template.settings.events['data-' + gesture] = gesture;

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
  app.fragranceGenres = soma.template.create($('#fragranceGenres')[0]);
  app.fragrancesGenreTitle = soma.template.create($('#fragrancesGenreTitle')[0]);
  app.available_fragrances = soma.template.create($('#available_fragrances')[0]);
  app.detailNavbar = soma.template.create($('#detailNavbar')[0]);
  app.fragranceDetail = soma.template.create($('#fragranceDetail')[0]);
  app.backToFragrance = soma.template.create($('#backToFragrance')[0]);
  app.cart = soma.template.create($('#cart')[0]);
  app.confirmation = soma.template.create($('#confirmation')[0]);



  //==============================
  // Get the data to be displayed:
  //==============================

  $.getJSON('data/fragrances.json')
    .then(function(data) {
      // Make acquired data available to templates:
      app.fragrancesCollection = data;
      // Render first template:
      app.fragranceGenres.render();
    });


  //================================================================
  // Set up genres for inital page load. This will be used to
  // filter fragrances based on which genre the user selects.
  // Define a method to get the genre of fragrance (ladies, men, kids).
  // This filters the genre from the total fragrances object.
  // Then renders the template on the next screen with that genre.
  //================================================================
  app.fragranceGenres.scope.genres = ['ladies', 'men', 'kids'];
  
  app.fragranceGenres.scope.getGenre = function(event) {
    var fragranceGenre = event.target.getAttribute('data-genre');
    //=============================================
    // Filter the data based on the user selection:
    //=============================================
    var whichFragrances = app.fragrancesCollection.filter(function(item) {
      return item.genre === fragranceGenre;
    });
    // Publish events for chosen genre and title of genre:
    //===================================================
    $.publish('chosen-genre-title', event.target.getAttribute('data-title'));
    $.publish('chosen-genre', whichFragrances);
  };

  //==========================================
  // ChosenGenreMediator
  // Update the template for the chosen genre:
  //==========================================
  var ChosenGenreMediator = $.subscribe('chosen-genre', function(topic, genre) {
    app.available_fragrances.scope.selectedGenre = genre;
    app.available_fragrances.render();
  }); 

  //===================================================
  // FragrancesGenreTitleMediator
  // Update title of genre list to reflect user choice:
  //===================================================
  var FragrancesGenreTitleMediator = $.subscribe('chosen-genre-title', function(topic, title){
    app.fragrancesGenreTitle.scope.title = title;
    app.fragrancesGenreTitle.render();
  });

  //================================================
  // Get the chosen fragrance and render its template:
  //================================================
  app.available_fragrances.scope.getChosenFragrance = function(e) {
    var item = e.target.nodeName === 'LI' ? e.target : $(e.target).closest('li')[0];
    var sku = item.getAttribute('data-sku');
    var chosenFragrance = app.available_fragrances.scope.selectedGenre.filter(function(fragrance) {
       return fragrance.sku === sku;
    });

    //=========================
    // Notify the navbar title:
    //=========================
    $.publish('chosen-fragrance', {title: app.fragrancesGenreTitle.scope.title, fragrance: chosenFragrance[0]});
  };

  //================================================
  // ChosenFragranceMediator
  // Update the detail view to show the user choice:
  //================================================
  var ChosenFragranceMediator = $.subscribe('chosen-fragrance', function(topic, choice) {
    app.detailNavbar.scope.genre_title = choice.title;
    app.detailNavbar.scope.product_title = choice.fragrance.product_title;
    app.detailNavbar.render();

    //========================
    // Update the detail view:
    //========================
    app.fragranceDetail.scope.chosenFragrance = choice.fragrance;
    app.fragranceDetail.render();
  });


  //===========================================
  // Calculate how many items have been chosen.
  // This is used in the shopping cart:
  //===========================================
  app.cart.scope.purchases = [];
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
    $.publish('add-to-cart', {
      title: app.fragrancesGenreTitle.scope.title,
      chosenFragrance: app.fragranceDetail.scope.chosenFragrance
    });
    $.publish('update-backTo-button', app.fragranceDetail.scope.chosenFragrance.product_title);
  });


  //===================================
  // AddToCartMediator
  // Update cart with chosen fragrance:
  //===================================
  var AddToCartMediator = $.subscribe('add-to-cart', function(topic, fragrance) {
    app.fragranceDetail.scope.chosenFragrance.genreTitle = fragrance.title;
    app.cart.scope.purchases.push(app.fragranceDetail.scope.chosenFragrance);
    app.cart.scope.disabled = false;
    app.cart.render();
  });


  //===================================
  // UpdateBackToButtonMediator
  // Update cart with chosen fragrance:
  //===================================
  var UpdateBackToButtonMediator = $.subscribe('update-backTo-button', function(topic, title) {
    app.backToFragrance.scope.fragranceName = title;
    app.backToFragrance.render();
  });


  //====================
  // View Shopping Cart:
  //====================

  // Popup for when cart is empty:
  app.cartIsEmpty = function() {
    $.UIPopup({
      id: "warning",
      title: 'Empty Cart!', 
      cancelButton: 'Close', 
      message: 'The shopping cart is empty. Add some items using the "+" button on the lower left.'
    });
  };

  $('#shoppingCart').on('singletap', function() {
    // If shopping cart is empty, show popup message:
    if (!app.cart.scope.purchases.length) {
      app.cartIsEmpty();
      return;
    }
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
    // Publish update for confirmation view:
    $.publish('update-confirmation-view', app.cart.scope.purchases);
  });

  //================================
  // UpdateConfirmationMediator
  // Update the confirmation page
  // with items chosen for purchase:
  //================================
  var UpdateConfirmationMediator = $.subscribe('update-confirmation-view', function(topic, purchases) {
      app.confirmation.scope.purchases = purchases;
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