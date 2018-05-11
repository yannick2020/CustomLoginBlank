//the main onload function, i have too many onleads and my browser is too random
var ScriptOrder = {
    LoadPageScripts:function(path){
    var i=0;
    for(var pathScripts in this){
        if(path.indexOf(pathScripts) >-1 ){
            for (i = 0; i < this[pathScripts].length; i++) {
                try {
                    this[pathScripts][i]();
                } catch (e) {
                }
            }
        }
    }
    for(i=0;i<this["Final"].length;i++){
        try{
            this["Final"][i]();
        }catch(e){}
    }
    },
    Final:[]
};
var roleKey = "custom:Roles";





