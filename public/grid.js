
function removeSpace(x){
  if(x.matches){
    var img = document.getElementById('gameThumb');
    if (document.getElementById('details').contains(img) == false && document.getElementById('list').innerHTML.length == 7)
    {
      document.getElementsByClassName('wishlist')[0].style.cssText = 'grid-column: 1 / 5;grid-row: 2 / 5;';
    }else{
      document.getElementsByClassName('wishlist')[0].style.cssText = 'grid-column: 1 / 5;grid-row: 4 / 7;';
    }

  }else{
    document.getElementsByClassName('wishlist')[0].style.cssText = 'grid-column: 3 / 5;grid-row: 1 / 5;padding:15px;';
  }

}

  var x = window.matchMedia("(max-width: 800px)");
  x.addListener(removeSpace);
