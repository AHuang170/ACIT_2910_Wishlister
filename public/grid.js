
var game = document.getElementsByClassName('game'),
    game_sale = document.getElementsByClassName('game_sale'),
    wishThumb = document.getElementsByClassName('wishThumb'),
    x = window.matchMedia("(max-width: 800px)");



function removeSpace(x){
  if(x.matches){
    var img = document.getElementById('gameThumb'),
        y = window.matchMedia('(max-width: 625px)');

    if (document.getElementById('details').contains(img) == false && document.getElementById('list').innerHTML.length == 7)
    {
      document.getElementsByClassName('wishlist')[0].style.cssText = 'grid-column: 1 / 5;grid-row: 2 / 5;';
    }else{
      document.getElementsByClassName('wishlist')[0].style.cssText = 'grid-column: 1 / 5;grid-row: 4 / 7;';
    }
    for(var i =0 ; i < game.length;i++){
      game[i].style.maxHeight = 250+'px';
      game[i].style.height = 100 + '%';
    };

    for(var i =0 ; i < game_sale.length;i++){
      game_sale[i].style.maxHeight = 250+'px';
      game_sale[i].style.height = 100 + '%';

    };

    for(var i =0; i < wishThumb.length;i++){
      wishThumb[i].style.width = 70 + '%';
      wishThumb[i].style.height = 'auto';
    }

    function stopOverlap(y){
      if(y.matches){

      for(var i =0; i < wishThumb.length;i++){
        wishThumb[i].style.width = 100 + '%';
        wishThumb[i].style.height = 60+ '%';
      };
      document.getElementById('title').innerHTML = '';

    }else{
      for(var i =0; i < wishThumb.length;i++){
        wishThumb[i].style.width = 70 + '%';
        wishThumb[i].style.height = 'auto';
      }
      document.getElementById('title').innerHTML = 'Wishlister';
    }
  }

    y.addListener(stopOverlap);

  }else{
    document.getElementsByClassName('wishlist')[0].style.cssText = 'grid-column: 3 / 5;grid-row: 1 / 5;padding:15px;';
    for(var i =0 ; i < game.length;i++){

      game[i].style.height = 112 + 'px';

    };
    for(var i =0 ; i < game_sale.length;i++){

      game_sale[i].style.height = 112 + 'px';

    };
    for(var i =0; i < wishThumb.length;i++){
      wishThumb[i].style.width = 'auto';
      wishThumb[i].style.height = 100+'%';
    };
  }
}
/*
function stopOverlap(y){
  if(y.matches){
    var
  }
}
*/

x.addListener(removeSpace);
