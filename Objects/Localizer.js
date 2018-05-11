var fs = require('fs');

function InitLocalizer(locale,custom){
    return function(String){
        var TranslatedString = String;
        var JsonLocale = {};
        var JsonCustomLocale = {};
        try {
            JsonLocale = JSON.parse(fs.readFileSync('./Locals/locale-'+locale+'.json', 'utf8'));
        }catch(e){
            JsonLocale = JSON.parse(fs.readFileSync('./Locals/locale-en-US.json', 'utf8'));
        }
        if(custom){
            try {
                JsonCustomLocale = JSON.parse(fs.readFileSync('./Locals/CustomLocals/locale-'+locale+'-'+custom+'.json', 'utf8'));
            }catch(e){

            }
        }

        if(JsonCustomLocale[String]){
            TranslatedString = JsonCustomLocale[String];
        }else if(JsonLocale[String]){
            TranslatedString = JsonLocale[String];
        }else{
            console.log("Unlocalized string: "+String);
        }
        return TranslatedString;
    }
}

module.exports = InitLocalizer;