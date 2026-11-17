<script context = "module">
export class Move{
    constructor(full,type,move,color,id){
        this.full = full,
        this.type = type,
        this.move = move,
        this.color = color,
        this.id = id
    }
}
export class Vector{
    constructor(x,y){
        this.x = x;
        this.y = y;
    }
    Equals(vector){
        return this.x == vector.x && this.y == vector.y ? true : false;
    }
}
</script>