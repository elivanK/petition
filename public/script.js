$(document).ready(function(){
    console.log('Canvas working');
    var canvas = document.getElementById("canvas"),
    context = canvas.getContext("2d"),
    //rect = canvas.getBoundingClientRect(),
    signature = document.getElementsByName('signature')[0],
    mouseX,
    mouseY;

    canvas.addEventListener("mousedown", onMouseDown);

    function onMouseDown(event){
        mouseX = event.offsetX;
        mouseY = event.offsetY;
        console.log(mouseX, mouseY);
        canvas.addEventListener("mousemove", onMouseMove);
        document.body.addEventListener("mouseup", onMouseUp);
    }

    function onMouseMove(event){
        context.beginPath();
        context.moveTo(mouseX, mouseY);
        mouseX = event.offsetX;
        mouseY = event.offsetY;
        context.lineTo(mouseX, mouseY);
        context.stroke();
    }

    function onMouseUp(event){
        //here we are getting the image as a string:
        signature.value = canvas.toDataURL();
        canvas.removeEventListener("mousemove", onMouseMove);
        document.body.removeEventListener("mouseup", onMouseUp);
    }

});
