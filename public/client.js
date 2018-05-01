var logWindow = document.getElementById('logWindow');

document.getElementById('login-header').addEventListener('click',function(){
  logWindow.style.display = 'block';
});

document.getElementById('logIn-close').addEventListener('click',function(){
  logWindow.style.display = 'none';
});
