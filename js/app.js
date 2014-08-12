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
  app.perfumeGenres = soma.template.create($('#perfumeGenres')[0]);
  app.fragrancesGenreTitle = soma.template.create($('#fragrancesGenreTitle')[0]);
  app.available_perfumes = soma.template.create($('#available_perfumes')[0]);
  app.detailNavbar = soma.template.create($('#detailNavbar')[0]);
  app.perfumeDetail = soma.template.create($('#perfumeDetail')[0]);
  app.backToPerfume = soma.template.create($('#backToPerfume')[0]);
  app.cart = soma.template.create($('#cart')[0]);
  app.confirmation = soma.template.create($('#confirmation')[0]);



  //==============================
  // Get the data to be displayed:
  //==============================

  $.getJSON('data/perfumes.json')
    .then(function(data) {
      // Make acquired data available to templates:
      app.perfumesCollection = data;
      // Render first template:
      app.perfumeGenres.render();
    });


  //================================================================
  // Set up genres for inital page load. This will be used to
  // filter perfumes based on which genre the user selects.
  // Define a method to get the genre of perfume (ladies, men, kids).
  // This filters the genre from the total perfumes object.
  // Then renders the template on the next screen with that genre.
  //================================================================
  app.perfumeGenres.scope.genres = ['ladies', 'men', 'kids'];
  
  app.perfumeGenres.scope.getGenre = function(event) {
    var perfumeGenre = event.target.getAttribute('data-genre');
    //=============================================
    // Filter the data based on the user selection:
    //=============================================
    var whichPerfumes = app.perfumesCollection.filter(function(item) {
      return item.genre === perfumeGenre;
    });
    // Publish events for chosen genre and title of genre:
    //===================================================
    $.publish('chosen-genre-title', event.target.getAttribute('data-title'));
    $.publish('chosen-genre', whichPerfumes);
  };

  //==========================================
  // ChosenGenreMediator
  // Update the template for the chosen genre:
  //==========================================
  var ChosenGenreMediator = $.subscribe('chosen-genre', function(topic, genre) {
    app.available_perfumes.scope.selectedGenre = genre;
    app.available_perfumes.render();
    app.fragrancesGenreTitle.render();
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
  // Get the chosen perfume and render its template:
  //================================================
  app.available_perfumes.scope.getChosenPerfume = function(e) {
    var item = e.target.nodeName === 'LI' ? e.target : $(e.target).closest('li')[0];
    var sku = item.getAttribute('data-sku');
    var chosenPerfume = app.available_perfumes.scope.selectedGenre.filter(function(perfume) {
       return perfume.sku === sku;
    });

    //=========================
    // Notify the navbar title:
    //=========================
    $.publish('chosen-fragrance', {title: app.fragrancesGenreTitle.scope.title, fragrance: chosenPerfume[0]});
  };

  //================================================
  // ChosenPerfumeMediator
  // Update the detail view to show the user choice:
  //================================================
  var ChosenPerfumeMediator = $.subscribe('chosen-fragrance', function(topic, choice) {
    app.detailNavbar.scope.genre_title = choice.title;
    app.detailNavbar.scope.product_title = choice.fragrance.product_title;
    app.detailNavbar.render();

    //========================
    // Update the detail view:
    //========================
    app.perfumeDetail.scope.chosenPerfume = choice.fragrance;
    app.perfumeDetail.render();
  });


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
    $.publish('add-to-cart', {
      title: app.fragrancesGenreTitle.scope.title,
      chosenPerfume: app.perfumeDetail.scope.chosenPerfume
    });
    $.publish('update-backTo-button', app.perfumeDetail.scope.chosenPerfume.product_title);
  });


  //===================================
  // AddToCartMediator
  // Update cart with chosen fragrance:
  //===================================
  var AddToCartMediator = $.subscribe('add-to-cart', function(topic, fragrance) {
    app.perfumeDetail.scope.chosenPerfume.genreTitle = fragrance.title;
    app.cart.scope.purchases.push(app.perfumeDetail.scope.chosenPerfume);
    app.cart.scope.disabled = false;
    app.cart.render();
  });


  //===================================
  // UpdateBackToButtonMediator
  // Update cart with chosen fragrance:
  //===================================
  var UpdateBackToButtonMediator = $.subscribe('update-backTo-button', function(topic, title) {
    app.backToPerfume.scope.perfumeName = title;
    app.backToPerfume.render();
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