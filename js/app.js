$(function () {

  ////////////////////////////////
  // Define model for frangrances:
  ////////////////////////////////
  var FragrancesModel = function() {
    this.data = [];
  };

  ///////////////////////////////////
  // Define model for shopping cart:
  ///////////////////////////////////
  var ShoppingCartModel = function() {
    this.chosenItems = [];
    this.checkCart = function() {
      return this.chosenItems.length;
    };

    this.addToCart = function(fragrance) {
      this.chosenItems.push(fragrance);

    }
    this.getItems = function() {
      return this.chosenItems;
    }
  };

  /////////////////////////////
  // Instantiate Shopping Cart:
  /////////////////////////////
  var Kart = new ShoppingCartModel();


  /////////////////////////////
  // Define Templates:
  /////////////////////////////

  // Template for first screen:
  //==========================
  var FragranceGenres = function(scope, template, dispatcher) {
    // Basic genres of fragrances:
    //============================
    scope.genres = ['ladies', 'men', 'kids'];

    // Listen for event to render the list of genres:
    //=======================================
    dispatcher.addEventListener('render-genre-template', function() {
      template.render();
    });
  };

  // Template for chosen genre title (second screen):
  //=================================================
  var FragrancesGenreTitle = function(scope, template, dispatcher) {
    dispatcher.addEventListener('genre-title-update', function(e) {
      scope.title = e.params.title;
      template.render();
    });
  };

  // Template for chosen genre (second screen):
  //==========================================
  var AvailableFragrances = function(scope, template, dispatcher) {
    // Listen for when the genre is chosen.
    // Then filter the fragrances by the chosen genre.
    //================================================
    dispatcher.addEventListener('render-chosen-genre', function(e) {
      var fragranceGenre = e.params.genre;
      scope.whichFragrances = FragrancesModel.data.filter(function(item) {
        return item.genre === fragranceGenre;
      });
      template.scope.selectedGenre = scope.whichFragrances;
      template.render(); 
    });  
    // Get the data for the fragrance the user chose:
    //===============================================
    scope.getChosenFragrance = function(e) {
      var item = e.target.nodeName === 'LI' ? e.target : $(e.target).closest('li')[0];
      var sku = item.getAttribute('data-sku');

      // Get the data for the chose fragrance 
      // for the detail template to render:
      //=====================================
      var chosenFragrance = scope.whichFragrances.filter(function(fragrance) {
         return fragrance.sku === sku;
      });

      // Dispatch event to update product title template:
      //=================================================
      dispatcher.dispatch('chosen-fragrance-title-update', {product_title: chosenFragrance[0].product_title});

      // Dispatch event with the chosen fragrance:
      //==========================================
      dispatcher.dispatch('chosen-fragrance-detail', chosenFragrance[0]);
    };
  };

  // Template for Detail Navbar:
  //============================
  var DetailNavbar = function(scope, template, dispatcher) {
    // Listen for event to update the value 
    // of the back button's genre:
    //=====================================
    dispatcher.addEventListener('genre-title-update', function(e) {
      scope.title = e.params.title;
      template.render();
    });

    // Listen for event to update the title of 
    // the detail screen for the chosen fragrance:
    //============================================
    dispatcher.addEventListener('chosen-fragrance-title-update', function(e) {
      scope.product_title = e.params.product_title;
      template.render();
    });
  };

  // Template for detail of chosen frangrance:
  //==========================================
  var FragranceDetail = function(scope, template, dispatcher, element) {
    dispatcher.addEventListener('chosen-fragrance-detail', function(e) {
      scope.chosenFragrance = e.params;
      $(element).data('chosenFragrance', e.params);
      template.render();
    });
  };

  // Template to manage adding to cart 
  // and updating shopping cart:
  //==================================

  var AddToCart = function(scope, template, dispatcher) {
    // Add chosen fragrance to shopping cart:
    //=======================================
    dispatcher.addEventListener('add-to-cart', function(e) {
      var chosen = $('#fragranceDetail').data('chosenFragrance');
      Kart.addToCart(chosen);

      // Dispatch event to update cart
      // with chose fragrance(s):
      //==============================
      dispatcher.dispatch('update-cart', chosen.product_title);
      $.UIGoToArticle('#cart');
    });
    template.render();
  };

  // Template for back button on cart screen:
  //=========================================
  var BackToFragrance = function(scope, template, dispatcher) {
    dispatcher.addEventListener('update-cart', function(e) {
      scope.fragranceName = e.params;
      template.render();
    });
  };

  // Template for shopping cart:
  //============================
  var Cart = function(scope, template, dispatcher) {
    // Calculate total number of chosen items:
    //========================================
    scope.getTotalItems = function() {
      if (!Kart.chosenItems.length) return 0;
      else return Kart.chosenItems.length;     
    };

    // Send event to update shopping cart:
    //====================================
    dispatcher.addEventListener('update-cart', function() {
      scope.purchases = Kart.chosenItems;
      template.render();
    });
  };

  // Template for confirmation screen:
  //==================================
  var Confirmation = function(scope, template, dispatcher) {
    // Send event to confirmation screen:
    //===================================
    dispatcher.addEventListener('update-confirmation', function() {
      scope.purchases = Kart.chosenItems;
      template.render();
    });
  };

  //////////////////////////////
  // Define Mediators for Views:
  //////////////////////////////

  // Define Mediator to get genre
  // of chosen fragrance:
  //=============================
  var ChosenGenreMediator = function(target, dispatcher) {
    $(target).on('singletap', 'li', function(event) {
      // Pass the chosen genre to the title template:
      var genreTitle = event.target.getAttribute('data-title');
      dispatcher.dispatch('genre-title-update', {title: genreTitle});
      // Pass the chosen genre to the list template:
      var fragranceGenre = event.target.getAttribute('data-genre');
      dispatcher.dispatch('render-chosen-genre', {genre: fragranceGenre});
    });
  };

  // Define Mediator to add fragrance to cart:
  //==========================================
  var AddToCartMediator = function(target, dispatcher) {
    $(target).on('singletap', function(event) {
      dispatcher.dispatch('add-to-cart');
    });
  };

  // Define Mediator for seeing cart:
  //=================================
  var GoToCartMediator = function(target, dispatcher) {
    
    // Private function to handle
    // when cart is empty:
    //===========================
    var cartIsEmpty = function() {
      $.UIPopup({
        id: "warning",
        title: 'Empty Cart!', 
        cancelButton: 'Close', 
        message: 'The shopping cart is empty. Add some items using the "+" button on the lower left.'
      });
    };

    // Handle user tap on button:
    $(target).on('singletap', function(event) {
      // If shopping cart is empty, show popup message:
      if (!Kart.checkCart()) {
       cartIsEmpty();
       return;
      }
      // Otherwise, go to cart view:
      $.UIGoToArticle('#cart');
    });
  };

  // Define Mediator to place order:
  //================================
  var PlaceOrderMediator = function(target, dispatcher) {
    $(target).on('singletap', function(event) {
      dispatcher.dispatch('update-confirmation');
      $.UIGoToArticle('#confirmation');
      $('#confirmationNum').text($.Uuid());
    });
  };

  // Define Mediator to cancel order:
  //=================================
  var CancelOrderMediator = function(target, dispatcher) {
    $(target).on('singletap', function(event) {
      $.UIGoBackToArticle('#main');
      Kart.chosenItems = [];
      dispatcher.dispatch('update-cart');
      dispatcher.dispatch('update-confirmation');
    });
  };

  // Hold Deferred for Ajax request:
  //================================
  var deferred;

  ///////////////////////////
  // Define template helpers:
  ///////////////////////////
  soma.template.helpers({

    // Capitalize first letter of String:
    //===================================
    capitalize : function ( str ) {
      if (!str) return;
      return str.charAt(0).toUpperCase() + str.slice(1);
    },

    // Calculate total cost of items.
    //===============================
    getTotalCost : function ( ) {
      var total = 0;
      Kart.chosenItems.forEach(function(item) {
        total += Number(item.wholesale_price);
      });
      // Return to two decimal places.
      return total.toFixed(2);   
    }
  });

  /////////////////
  // Define module:
  /////////////////
  var Application = soma.Application.extend({ 
    init: function() {
      var $this = this;

      // Make Ajax request for JSON data:
      //=================================
      deferred = $.getJSON('data/fragrances.json', function(data) {
       FragrancesModel.data = data;
      });

      // Define Mediators:
      //==================
      this.mediators.create(ChosenGenreMediator, $('#fragranceGenres')[0]);
      this.mediators.create(AddToCartMediator, $('#addToCart')[0]);
      this.mediators.create(GoToCartMediator, $('#shoppingCart')[0]);
      this.mediators.create(PlaceOrderMediator, $('#placeOrder')[0]);
      this.mediators.create(CancelOrderMediator, $('#cancelOrder')[0]);

      // Initialize the app's templates:
      //================================
      this.createTemplate(FragranceGenres, $('#fragranceGenres')[0]);
      this.createTemplate(FragrancesGenreTitle, $('#fragranceGenreTitle')[0]);
      this.createTemplate(AvailableFragrances, $('#available_fragrances')[0]);
      this.createTemplate(DetailNavbar, $('#detailNavbar')[0]);
      this.createTemplate(FragranceDetail, $('#fragranceDetail')[0]);
      this.createTemplate(AddToCart, $('#addToCart')[0]);
      this.createTemplate(BackToFragrance, $('#backToFragrance')[0]);
      this.createTemplate(Cart, $('#cart')[0]);
      this.createTemplate(Confirmation, $('#confirmation')[0]);
    },

    start: function() {
      var $this = this;
      // Render the template when 
      // the Ajax request is complete:
      //==============================
      deferred.done(function() {
        $this.dispatcher.dispatch('render-genre-template');
      })
    }
  });

  //////////////////////
  // Instantiate module:
  //////////////////////
  var app = new Application();

});