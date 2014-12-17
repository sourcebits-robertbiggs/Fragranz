$(function () {

  /////////////////
  // Initial setup.
  /////////////////

  //======================
  // Create app namespace:
  //======================
  var app = {};

  // Default app properties:
  app.cart = {};
  app.cart.purchases = [];
  app.cart.totalItems = 0;
  app.cart.totalCost = 0;
  app.calculateTotalCost = $.noop;
  app.chosenFragrance = '';
  app.fragrancesCollection = [];
  app.chosenGenreFragrances = [];


  
  ///////////////////////////////////
  // Get the fragrances to displayed:
  ///////////////////////////////////
  $.getJSON('data/fragrances.json')
    .then(function(data) {
      // Make acquired data available to templates:
      app.fragrancesCollection = data;
    });


  /////////
  // Views:
  /////////

  // Define Templates:
  ////////////////////
  var genreListTemplate = $('#genreListTemplate').html();
  var availableFragrancesTemplate = $('#availableFragrancesTemplate').html();
  var fragranceDetailTemplate = $('#fragranceDetailTemplate').html();
  var cartItemsTemplate = $('#cartItems').html();
  var purchaseDetailsTemplate = $('#purchaseDetailsTemplate').html();

  // Parse templates: 
  //=================
  var parsedGenreList = $.template(genreListTemplate);
  var parsedAvailableFragrances = $.template(availableFragrancesTemplate, 'fragrance');
  var parsedFragranceDetail = $.template(fragranceDetailTemplate, 'chosenFragrance');
  var parsedCartItems = $.template(cartItemsTemplate, 'item');
  var parsedPurchaseDetails = $.template(purchaseDetailsTemplate, 'item');


  //=======================
  // Render list of genres:
  //=======================
  $('#fragranceGenres').empty();
  ['ladies','men','kids'].forEach(function(genre){
    $('#fragranceGenres').append(parsedGenreList(genre));
  });



  ////////////////////
  // Render fragrances 
  // for chosen genre:
  ////////////////////

  //===============================
  // Event handler to render list 
  // of chosen genre of fragrances:
  //===============================
  $('#fragranceGenres').on('singletap', 'li', function() {
    var chosenGenre = $(this).attr('data-genre');
    app.chosenGenreFragrances = app.fragrancesCollection.filter(function(item) {
      return item.genre === chosenGenre;
    });

    // Publish broadcasts and data for 
    // chosen genre and title of genre:
    //=================================
    $.publish('chosen-genre-title', chosenGenre);
    $.publish('chosen-genre', app.chosenGenreFragrances);
  });

  //========================================
  // Define Mediator for chosen genre title:
  //========================================
  var genreTitle = $.subscribe('chosen-genre-title', function(topic, genre) {
    $('#fragrancesGenreTitle').html(genre);
  });

  //======================================
  // Define Mediator to show chosen genre.
  // Render the template with the genre:
  //======================================
  var ChosenGenreMediator = $.subscribe('chosen-genre', function(topic, genre) {
    $('#availableFragrances').empty();
    genre.forEach(function(item) {
      $('#availableFragrances').append(parsedAvailableFragrances(item));
    });
  }); 


  //////////////////////////////////////
  // Render detail of selected fragrance
  //////////////////////////////////////

  //=====================================
  // Render detail of selected fragrance:
  //=====================================
  $('#availableFragrances').on('singletap', 'li', function() {
    var sku = $(this).attr('data-sku');
    var chosenFragrance = app.chosenGenreFragrances.filter(function(fragrance) {
       return fragrance.sku === sku;
    });

    // Notify the navigation bar title:
    //=================================
    $.publish('chosen-fragrance', {title: chosenFragrance[0].product_title, fragrance: chosenFragrance[0]});
  });

  //============================
  // Define Mediators to render 
  // detail of chosen fragrance:
  //============================
  var ChosenFragranceTitleMediator = $.subscribe('chosen-fragrance', function(topic, choice) {
    $('#detailTitle').html(choice.fragrance.product_title);
  });
  var ChosenFragranceBackMediator = $.subscribe('chosen-fragrance', function(topic, choice) {
    $('#backToGenre').html(choice.fragrance.genre);
  });
  var ChosenFragranceMediator = $.subscribe('chosen-fragrance', function(topic, choice) {
    app.chosenFragrance = choice.fragrance;
    $('#fragranceDetail').html(parsedFragranceDetail(choice.fragrance));
  });
   


  ///////////////////////////
  // Setup Purchase Workflow:
  ///////////////////////////

  //===============================
  // Define method to calculate 
  // total cost. For use in
  // Cart View & Confirmation View.
  //===============================
  app.calculateTotalCost = function() {
    var total = 0;
    app.cart.purchases.forEach(function(item) {
      total += Number(item.wholesale_price);
    });
    return total.toFixed(2);
  }; 

  //======================
  // Add to Shopping Cart:
  //======================
  $('#addToCart').on('singletap', function() {
    $.UIGoToArticle('#cart');
    $.publish('add-to-cart', {
      chosenFragrance: app.chosenFragrance
    });
    app.cart.purchases.push(app.chosenFragrance);
    $.publish('update-backTo-button', app.chosenFragrance.product_title);
  });


  //===============================
  // Define Mediator to update cart
  // with chosen fragrance:
  //===============================
  var AddToCartMediator = $.subscribe('add-to-cart', function(topic, obj) {
    app.cart.totalItems++;
    app.cart.totalCost = app.calculateTotalCost();
    $('#totalItems').html(app.cart.totalItems);
    $('#totalCost span').html(app.cart.totalCost);
    $('#backToFragrance').html(obj.chosenFragrance.product_title);
    $('#purchaseItems').append(parsedCartItems(obj.chosenFragrance));
  });


  //====================
  // View Shopping Cart:
  //====================

  // Popup for when cart is empty:
  //==============================
  app.cartIsEmpty = function() {
    $.UIPopup({
      id: "warning",
      title: 'Empty Cart!', 
      cancelButton: 'Close', 
      message: 'The shopping cart is empty. Add some items using the "+" button on the lower left.'
    });
  };

  //============================
  // Event handler to show cart:
  //============================
  $('#shoppingCart').on('singletap', function() {
    // If shopping cart is empty, show popup message:
    if (!app.cart.purchases.length) {
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
    $.publish('update-confirmation-view', app.cart.purchases);
    $('#confirmTotalCost span').html(app.cart.totalCost)
  });

  //=====================================
  // Mediator to update the confirmation
  // view with items chosen for purchase:
  //=====================================
  var UpdateConfirmationMediator = $.subscribe('update-confirmation-view', function(topic, purchases) {
      $('#purchaseDetails').empty();
      app.cart.purchases.forEach(function(item) {
        $('#purchaseDetails').append(parsedPurchaseDetails(item));
      });
      $('#totalCost span').html(app.cart.totalCost);
  });

  //==============
  // Cancel Order:
  //==============
  $('#cancelOrder').on('singletap', function() {
    // Return to the main view:
    $.UIGoBackToArticle('#main');
    // Reset the shopping cart:
    app.cart.purchases = [];
    app.cart.totalItems = 0;
    app.cart.totalCost = 0;
    $('#purchaseItems').empty();
  });
   
});