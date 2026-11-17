<script context = "module">
import { pieces, Piece, EmptyPieces } from './pieces.svelte';
import { Vector } from './types.svelte';
import { CalculateMoves } from './moves.svelte';
//Converts from [x,y] to algebraic notation ([1,6] to a6)
export function convertToAN(tile){
    var characters = ['a','b','c','d','e','f','g','h'];
    var tileConverted = characters[tile.x - 1] + tile.y;
    return tileConverted;
}
//Does the exact opposite of the last function
export function convertToXY(tile){
    var characters = ['a','b','c','d','e','f','g','h'];
    var tileConverted = new Vector(characters.indexOf(tile.split("")[0]) + 1, parseInt(tile.split("")[1]));
    return tileConverted;
}
export function isTileEmpty(tile){
    if(pieces.find(({location}) => location.x == tile.x && location.y == tile.y) == undefined){
        return true;
    }
    return false;
}
export function findByLocation(tile){
    var result = pieces.find(({location}) => location.x == tile.x && location.y == tile.y);
    return result;
}
export function findById(ID){
    var result = pieces.find(({id}) => id == ID);
    return result;
}
//Checks if a tile is not on the board
export function isOutOfBounds(tile){
    for (let i = 1; i <= 8; i++) {
        for(let j = 1; j <= 8; j++){
            var currentTile = new Vector(i,j);
            if(tile.x == currentTile.x && tile.y == currentTile.y){
                return false;
            }
        }
    }
    return true;
}
export function getIDs(){
    const IDs = [];
    for(let y = 1; y <= 8; y++){
        for(let x = 1; x <= 8; x++){
            var currentTile = new Vector(x,y);
            pieces.forEach(piece => {
                if(currentTile.Equals(piece.location)){
                    IDs.push(piece.id);
                }
            });
        }
    }
    return IDs;
}
export function getFEN(){
    var result = "";
    for (let i = 1; i <= 8; i++) {
        var emptyTiles = 0;
        for(let j = 1; j <= 8; j++){
            var currentTile = new Vector(j,i);
            if(findByLocation(currentTile) != undefined && findByLocation(currentTile).shorttype != "") {
                if(emptyTiles != 0){
                    result += emptyTiles;
                    emptyTiles = 0; 
                }
                result += findByLocation(currentTile).color == "white" ? findByLocation(currentTile).shorttype.toLocaleLowerCase() : findByLocation(currentTile).shorttype.toLocaleUpperCase();
            }
            if(findByLocation(currentTile) != undefined && findByLocation(currentTile).shorttype == "") {
                if(emptyTiles != 0){
                    result += emptyTiles; 
                    emptyTiles = 0; 
                } 
                result += findByLocation(currentTile).color == "white" ? "p" : "P";
            }
            if(findByLocation(currentTile) == undefined){
                emptyTiles++;
            }
            if(j == 8 && emptyTiles == 8) result += 8;
        }
        result += "/";
    }
    result = result.slice(0, -1);
    return result;
}
export function setFEN(FEN,IDs){
    var index = 0;
    var FENsplit = FEN.split("/");
    EmptyPieces();
    for (let i = 1; i <= 8; i++) {
        var skipTiles = 0;
        for(let j = 1; j <= 8; j++){
            var piece = FENsplit[i-1].split("")[j-1];
            if(piece == undefined){
                continue;
            }
            if(!isNaN(piece)){
                skipTiles+=parseInt(piece-1);
                continue;
            } 
            const typesMap = new Map([
                ["p","pawn"],
                ["r","rook"],
                ["b","bishop"],
                ["n","knight"],
                ["q","queen"],
                ["k","king"],
            ]);
            var type = typesMap.get(piece.toLocaleLowerCase());
            var color = piece == piece.toLocaleLowerCase() ? "white" : "black";
            var location = new Vector(j+skipTiles,i);
            pieces.push(new Piece(type,color,location,parseInt(IDs[index])));
            index++;
        }
    }
}
export function range(start, end, step, offset) {
    var len = (Math.abs(end - start) + ((offset || 0) * 2)) / (step || 1) + 1;
    var direction = start < end ? 1 : -1;
    var startingPoint = start - (direction * (offset || 0));
    var stepSize = direction * (step || 1);
    
    return Array(len).fill(0).map(function(_, index) {
      return startingPoint + (stepSize * index);
    });
}
export function determineColor(x,y){
    if(y % 2 == 0 && x % 2 == 0){
        return "light";
    }
    if(y % 2 == 1 && x % 2 == 1){
        return "light";
    }
    if(y % 2 == 1 && x % 2 == 0){
        return "dark";
    }
    if(y % 2 == 0 && x % 2 == 1){
        return "dark";
    }
    return null;
}
//gets all of the moves that are attacking a specific piece
export function getAttackingMoves(piece,piecesList,turn){
    var possibleMoves = CalculateMoves(piecesList,turn,false);
    var attackingMoves = possibleMoves.filter(move => (move.move.Equals(piece.location) && move.color != turn));
    return attackingMoves;
}
//checks if the king is checked
export function isKingChecked(turn){
    var king = pieces.find(({type, color}) => type == "king" && color == turn);
    var attackingMoves = getAttackingMoves(king);
    if(attackingMoves.length == 0) return false;
    return true;
}
//checks if the king will be checked after a specified move
export function willKingBeChecked(move,turn){
    var king = pieces.find(({type, color}) => type == "king" && color == turn);
    const piecesCopy = pieces;
    var piece = piecesCopy.find(({id}) => id == move.id);
    var deletedPiece = piecesCopy.find(({location, id}) => location.Equals(move.move) && id != move.id);
    if(deletedPiece != undefined){
        piecesCopy.splice(piecesCopy.indexOf(deletedPiece),1);
    }
    piece.location = move.move;
    var attackingMoves = getAttackingMoves(king,piecesCopy,turn);
    if(attackingMoves.length == 0) return false;
    return true;
}
</script>