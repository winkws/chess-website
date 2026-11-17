<script context = "module">
import { pieces } from './pieces.svelte';
import { convertToAN, convertToXY, findByLocation, isTileEmpty, isOutOfBounds, findById, range } from './functions.svelte';
import { Move, Vector } from './types.svelte';
import { getMoveHistory } from '../gameController.svelte';

//returns a list of all playable moves
export function CalculateMoves(piecesList,turn,calculateCheck) {
    var possibleMoves = [];
    //loops through all of the provided pieces and checks what type it is
    //after that it calculates the moves it can do and adds the moves to a list
    piecesList.forEach(piece => {
        if(piece.type == "pawn"){
            possibleMoves = possibleMoves.concat(CalculatePawnMoves(piece));
        }
        if(piece.type == "knight"){
            possibleMoves = possibleMoves.concat(CalculateKnightMoves(piece));
        }
        if(piece.type == "bishop" || piece.type == "rook" || piece.type == "queen"){
            possibleMoves = possibleMoves.concat(CalculateSlidingMoves(piece));
        }
        if(piece.type == "king"){
            possibleMoves = possibleMoves.concat(CalculateKingMoves(piece,turn));
        } 
    });
    if(!calculateCheck) return possibleMoves;
    //if the king is under attack replaces the moves with moves that can save the king
    var attackingMoves = CalculateAttackingMoves(pieces,turn); 
    if(attackingMoves.length != 0){
        possibleMoves = CalculateKingSavingMoves(possibleMoves,turn);
        if(possibleMoves.length == 0){
            console.log("you lost");
        }
    }
    return possibleMoves;
}

//returns a list of all playable pawn moves
function CalculatePawnMoves(piece){
    var possibleMoves = [];
    //checks whether the pawn can go up or down (up is 1 and down is -1)
    var direction = piece.color == "white" ? 1 : -1;
    //gets the amount of tiles the pawn can move
    var canMoveTiles = 2;
    getMoveHistory().forEach(move => {
        if(piece.id == move.id){
            canMoveTiles = 1;
        }
    });
    //calculates the moves for moving up
    for(let i = 1; i <= canMoveTiles; i++){
        var moveTile = new Vector(piece.location.x, piece.location.y+i*direction);
        if(!isTileEmpty(moveTile)) break;
        var moveFull = convertToAN(moveTile);
        possibleMoves.push(new Move(moveFull, piece.type, moveTile, piece.color, piece.id));
    }
    //check if theres an enemy piece in the top/bottom-left and top/bottom-right tiles
    for(let i = -1; i <= 1; i+=2){
        var moveTile = new Vector(piece.location.x + i, piece.location.y + direction);
        if(!isTileEmpty(moveTile) && findByLocation(moveTile).color != piece.color){
            var moveFull = piece.location.x + "x" + moveTile;
            possibleMoves.push(new Move(moveFull, piece.type, moveTile, piece.color, piece.id));
        }
    }
    //checks if there is an enemy pawn next to the selected pawn and if you can en passant it
    for(let i = -1; i <= 1; i+=2){
        var checkTile = new Vector(piece.location.x+i,piece.location.y);
        var moveTile = new Vector(piece.location.x+i,piece.location.y+direction);
        //checks if the tile its checking has a pawn that is the opposite color of the pawn that the function is calculating moves for and checks if it can en passant it
        var checkPiece = findByLocation(checkTile);
        if(checkPiece != undefined && checkPiece.type == "pawn" && checkPiece.color != piece.color){
            var moveHistory = getMoveHistory();
            var lastMovedPlayed = moveHistory[moveHistory.length-1].from;
            if(lastMovedPlayed.y - 2 == checkPiece.location.y || lastMovedPlayed.y + 2 == checkPiece.location.y){
                var moveFull = piece.location.x+ "x" + convertToAN(new Vector(piece.location.x+i,(piece.location.y + direction))) + " e.p"
                possibleMoves.push(new Move(moveFull, piece.type, moveTile, piece.color, piece.id));
            }
        }
    }
    return possibleMoves;
}

//returns a list of all playable knight moves
function CalculateKnightMoves(piece){
    var possibleMoves = [];
    //loops through all of the tiles the knight could land on and checks if it can
    piece.moves.forEach(move => {
        var moveTile = new Vector(piece.location.x + move.x, piece.location.y + move.y);
        var moveFull = piece.shorttype + convertToAN(moveTile);
        if(!isOutOfBounds(moveTile) && (findByLocation(moveTile) == undefined || findByLocation(moveTile).color != piece.color)){
            possibleMoves.push(new Move(moveFull, piece.type, moveTile, piece.color, piece.id));
        }
    });
    return possibleMoves;
}

//returns a list of all sliding moves (rook, bishop and queen)
function CalculateSlidingMoves(piece){
    var possibleMoves = [];
    piece.moves.forEach(move => {
        for(let d = 1; d <= piece.distance; d++){
            var moveTile = new Vector(piece.location.x + (move.x * d), piece.location.y + (move.y * d));
            if(isOutOfBounds(moveTile)) break;
            if(!isTileEmpty(moveTile) && findByLocation(moveTile).color == piece.color) break;
            possibleMoves.push(new Move(piece.shorttype + moveTile, piece.type, moveTile, piece.color, piece.id));
            if(!isTileEmpty(moveTile) && findByLocation(moveTile).color != piece.color) break;
        }
    });
    return possibleMoves;
}

//returns a list of all king moves
function CalculateKingMoves(piece,turn){
    //calculate normal king moves
    var possibleMoves = [];
    piece.moves.forEach(move => {
        var moveTile = new Vector(piece.location.x + move.x, piece.location.y + move.y);
        var tilePiece = findByLocation(moveTile);
        if(!isOutOfBounds(moveTile) && (tilePiece == undefined || tilePiece.color != piece.color)){
            possibleMoves.push(new Move(piece.shorttype + moveTile, piece.type, moveTile, piece.color, piece.id));
        }
    });
    //calculate castling moves
    var rookY = piece.color == "white" ? 1 : 8;
    var rooks = {rook1:findByLocation(new Vector(1,rookY)),rook2:findByLocation(new Vector(8,rookY))};
    var hasRookMoved = {rook1:false,rook2:false};
    //return if the king has already moved
    getMoveHistory().forEach(move => {
        if(piece.id == move.id) return;
        if(rooks.rook1 == undefined || rooks.rook1.id == move.id) hasRookMoved.rook1 = true;
        if(rooks.rook2 == undefined || rooks.rook2.id == move.id) hasRookMoved.rook2 = true;
    });
    if(!hasRookMoved.rook1){
        if(isTileEmpty(new Vector(3,rookY))) possibleMoves.push(new Move("O-O-O", piece.type, new Vector(3,rookY), piece.color, piece.id));
    }
    if(!hasRookMoved.rook2){
        if(isTileEmpty(new Vector(7,rookY))) possibleMoves.push(new Move("O-O", piece.type, new Vector(7,rookY), piece.color, piece.id));
    } 
    return possibleMoves;
}

//returns a list of moves that can save the king from being captured
function CalculateKingSavingMoves(possibleMoves,turn){
    var defensiveMoves = [];
    const piecesCopy = pieces;
    possibleMoves.forEach(move => {
        var piece = piecesCopy.find(({id}) => id == move.id);
        var locationBefore = piece.location;
        var deletedPiece = piecesCopy.find(({location, id}) => location.Equals(move.move) && id != move.id);
        if(deletedPiece != undefined){
            piecesCopy.splice(piecesCopy.indexOf(deletedPiece),1);
        }
        piece.location = move.move;
        var newAttackingMoves = CalculateAttackingMoves(piecesCopy,turn);
        if(newAttackingMoves.length == 0 && move.color == turn){
            defensiveMoves.push(move);
        }
        piece.location = locationBefore;
        if(deletedPiece != undefined){
            piecesCopy.push(deletedPiece);
        }
    });
    return defensiveMoves;
}

export function MovePiece(piece,move,turn,possibleMoves){
    if(piece == null || piece.location == move || piece.color != turn) return;
    var moveSound = new Audio("/assets/sounds/moveSound.mp3");
    var succesfulMove = false;
    possibleMoves.forEach(Move => {
        if(piece.id == Move.id && convertToXY(move).Equals(Move.move)){
            if(piece.type == "pawn" && (Move.move.y == 8 || Move.move.y == 1)){
                piece.Move(Move.move);
                openPromotionMenu(turn,piece);
                //game.gamePaused = true;
            }
            if(Move.full == "O-O-O"){
                findByLocation(new Vector(1,piece.location.y)).location = new Vector(4,piece.location.y);
            }
            if(Move.full == "O-O"){
                findByLocation(new Vector(8,piece.location.y)).location = new Vector(6,piece.location.y);
            }
            if(Move.full.includes("e.p")){
                var direction = Move.color == "white" ? -1 : 1;
                findByLocation(new Vector(Move.move.x, Move.move.y+direction)).Delete();
            }
            if(findByLocation(Move.move) != undefined){
                findByLocation(Move.move).Delete();
            }
            piece.Move(Move.move);
            piece.hasmoved = true;
            moveSound.play();
            succesfulMove = true;
        }
    });
    if(succesfulMove){
        return true;
    }
    return false;
}
</script>