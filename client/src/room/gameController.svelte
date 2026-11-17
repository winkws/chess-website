<script>
import { Socket } from '../stores/socket';
import { pieces } from "./modules/pieces.svelte";
import { findByLocation, convertToXY, convertToAN, getIDs, getFEN, setFEN} from "./modules/functions.svelte";
import { CalculateMoves, MovePiece } from "./modules/moves.svelte";

var socket;
Socket.subscribe(data => {
    socket = data;
});

var isSpectator;
var playerColor;
var turn;
var selectedPiece = null;
const username = document.cookie.split("Username=")[1].split(";")[0];
socket.emit('joinGame',username);

socket.on('getInfo', roomData => {
    if(username != roomData.player1.username && username != roomData.player2.username) isSpectator = true;
    playerColor = username == roomData.player2.username ? "black" : "white";
    turn = roomData.turn;
    socket.emit('requestMoveHistory', username);
    Roomdata = roomData;
    PlayerColor = playerColor;
});

socket.on('move', data => {
    setFEN(data.FEN, data.IDs);
    Update();
    socket.emit('requestMoveHistory', username);
});

socket.on('receiveMoveHistory', history => {
    MoveHistory = history;
});

document.onmousedown = (e) => {
    if(GetClosestTile(e) == undefined) return;
    selectedPiece = findByLocation(convertToXY(GetClosestTile(e).id));
    ShowMoves(selectedPiece);
    //console.log(selectedPiece.id);
}

document.onmouseup = (e) => {
    var piece = selectedPiece;
    var location = piece.location;
    if(getPlayerColor() != turn || isSpectator){
        UpdateBoard();
        return;
    }
    if(GetClosestTile(e) == undefined) return;
    if(MovePiece(piece, GetClosestTile(e).id, turn, CalculateMoves(pieces,turn,true))){
        socket.emit('move',{FEN:getFEN(),ID:getRoomdata().id,IDs:getIDs(),move:{from:location,to:convertToXY(GetClosestTile(e).id),id:piece.id}});
        Update();
    }
    else{
        UpdateBoard();
    }
}

function Update(){
    turn = turn == "white" ? turn = "black" : turn = "white";
    //possibleMoves = CalculateMoves(pieces,turn);
    UpdateBoard();
}

function GetClosestTile(e){
    var closest = undefined;
    document.getElementById("board").childNodes.forEach(element => {
        element.childNodes.forEach(child => {
            if(child.className != undefined){
                const rect = child.getBoundingClientRect();
                var x = e.clientX - rect.x - rect.width / 2;
                var y = e.clientY - rect.y - rect.height / 2;
                if(x < 50 && x > -50 && y < 50 && y > -50){
                    closest = child;
                }
            }
        });
    });
    return closest;
}

function ShowMoves(piece){
    if(getPlayerColor() != turn || isSpectator) return;
    const elements = document.getElementById("board").childNodes;
    elements.forEach(element => {
        element.childNodes.forEach(child => {
            child.innerHTML = "";
        });
    })
    //Loops through all of the moves and displays a circle on all of the tiles with a possible move
    CalculateMoves(pieces,turn,true).forEach(move => {
        if(piece.id == move.id && turn == move.color){
            document.getElementById(convertToAN(move.move)).innerHTML = "circle";
        }
    });
}
</script>

<script context="module"> 
export function UpdateBoard(){
    //Refreshes location of pieces
    document.getElementById("board").childNodes.forEach(element => {
        element.childNodes.forEach(child => {
            if(child.className != undefined){
                child.innerHTML = "";
                child.style.backgroundImage = "";
                const piece = findByLocation(convertToXY(child.id));
                if(piece != undefined){
                    child.style.backgroundImage = `url(/assets/pieces/${piece.color}${piece.type}.png)`;
                }
            }  
        });
    })
}

let PlayerColor;
let Roomdata;
let MoveHistory = [];
export function getPlayerColor(){
    return PlayerColor;
}
export function getRoomdata(){
    return Roomdata;
}
export function getMoveHistory(){
    return MoveHistory;
}
</script>