var request = require('request');

var StoreFinder = {
    /**
     * Will return an array of store object formatted like so {Name:name,Vale:value}
     * @param req express request, only used to read info, req.body.zipcode contains zipcode
     * @param callbacks
     * @returns callback with a StoreNames as parameter
     * @exception Error
     */
    FindStore:function(req,callbacks){
        //logs in console if no callbacks have been set
        var onFailure = (callbacks.onFailure||console.log);
        var onSuccess = (callbacks.onSuccess||console.log);
        var options = {
            url:"https://foo.bar"+req.body.zipcode,
            method:"GET"
        };
        request(options,function(err,response,body){
            if(!err){
                var insee = '';
                try{
                    var AreaCodes = body.match(/\d\d\d\d\d(?=&)/);
                    if(AreaCodes&&AreaCodes.length ===1){
                        insee = AreaCodes[0];
                        var url ='https://foo.bar'+insee;
                        var options = {
                            url:url,
                            method:'GET'
                        };
                        request(options,function (error, response, body) {
                            if(!error) {
                                var StoreListRegex = /tc_vars\["search_magasins"\]\[\d\]\["search_magasins_nom"\] = "\d\d\d"/g;
                                var StoreListMap = function (store) {
                                    return 'WebID_'+JSON.parse(store.replace(/tc_vars\["search_magasins"\]\[\d\]\["search_magasins_nom"\] = /, ''))
                                };
                                var storeWEB_ID = {};
                                req.app.get('storeIntegration').map(function(config){
                                    if(config.hasOwnProperty("name")&&config.name==="nosicaToStoreIdMap"){
                                        storeWEB_ID.name=config.name;
                                        storeWEB_ID.value = {};
                                        config.value.map(function(store){
                                            storeWEB_ID.value[store.name] = store.value;
                                        });
                                    }
                                });
                                var storeNameList = {};
                                req.app.get('storeIntegration').map(function(config){
                                    if(config.hasOwnProperty("name")&&config.name==="storeDescriptionList"){
                                        storeNameList.name=config.name;
                                        storeNameList.value = {};
                                        config.value.map(function(store){
                                            storeNameList.value[store.name] = store.value;
                                        });
                                    }
                                });
                                try {
                                    var StoreList = body.match(StoreListRegex).map(StoreListMap);
                                    var StoreNames = StoreList.map(function (storeID) {
                                        console.log(storeID);
                                        return {
                                            Name: storeNameList.value[storeWEB_ID.value[storeID]],
                                            Value: "StoreId:" + storeWEB_ID.value[storeID]
                                        };
                                    });
                                    onSuccess(StoreNames);
                                }catch(e){
                                    var err = new Error('Invalid Zip Code');
                                    err.status = 400;
                                    onFailure(err)

                                }
                            }else{
                                onFailure(error);
                            }
                        });
                    }else{
                        if(req.body.zipcode !== '00000' && req.app.get('CustomConfig').AppConfig.debug === true) {
                            //todo FOR DEBUG ONLY
                            var error = new Error('No stores found');
                            error.status = 400;
                            onFailure(error);
                        }else{
                            onSuccess([{Name:"Magasin Test",Value:'StoreId:971'}]);
                        }
                    }
                }catch(e){
                    onFailure(e);
                }

            }else{
                onFailure(err);
            }
        });
    }
};

module.exports = StoreFinder;