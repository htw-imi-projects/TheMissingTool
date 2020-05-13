
function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function addListeners(card) {
    card.addEventListener('mousedown', function (event) {

        // Remove entrance animation
        card.classList.remove("animate");

        let shiftX = event.clientX - card.getBoundingClientRect().left;
        let shiftY = event.clientY - card.getBoundingClientRect().top;

        card.style.position = "absolute";
        card.style.zIndex = 1000;
        document.getElementById('overlay').append(card);

        moveAt(event.pageX, event.pageY);

        function moveAt(pageX, pageY) {
            card.style.left = pageX - shiftX + 'px';
            card.style.top = pageY - shiftY + 'px';
        }

        function onMouseMove(event) {
            moveAt(event.pageX, event.pageY);
        }

        document.addEventListener('mousemove', onMouseMove);

        card.onmouseup = function () {
            document.removeEventListener('mousemove', onMouseMove);
            card.onmouseup = null;
        };

        card.ondragstart = function () {
            return false;
        };
    });
}


$(() => {

    $("#plus").click(() => {

        const card = document.createElement('div');
        card.className = 'item animate';
        card.style.backgroundColor = getRandomColor();
        card.innerHTML = "<textarea type='text' value=''></textarea>";
        addListeners(card);
        sendCard({
            color: card.style.backgroundColor
        });

        getCards();

    });

    function createDiv(rawCard) {
        const card = document.createElement('div');
        card.className = 'item animate';
        addListeners(card);

        card.style.left = rawCard.position.left;
        card.style.top = rawCard.position.top;
        card.style.fontSize = rawCard.fontSize;
        card.style.backgroundColor = rawCard.backgroundColor;

        document.getElementById('overlay').appendChild(card)
    }

    function getCards() {
        $.get('http://localhost:4000/cards', (data) => {
            data.forEach(createDiv);
        })
    }

    function sendCard(card) {
        $.post('http://localhost:4000/', card)
    }

    socket.on('card', sendCard)
});





