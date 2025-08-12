let contador = 0;
document.getElementById('incrementar').onclick = function(){
    contador++;
    document.getElementById('contador').innerText = contador;
};