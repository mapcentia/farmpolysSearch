'use strict';

/**
 * @type {*|exports|module.exports}
 */
var React = require('react');

var ReactDOM = require('react-dom');

var cloud;

var layerGroupMouseOver = L.layerGroup();

var layerGroupAll = L.layerGroup();

var utils;

var mapObj;

var exId = "farmpolysSearch";

var config = require('../../../../config/config.js');

var mainSearch;

var items = {};

var HTMLReactParser = require('html-react-parser');

module.exports = {
    set: function (o) {
        cloud = o.cloud;
        utils = o.utils;
        mapObj = cloud.get().map;
        mainSearch = o.extensions.vidisearch.index;

    },

    init: function () {
        let me = this;
        mainSearch.registerSearcher({
            key: 'Farm Portions Polygons',
            obj: {'searcher': this, 'title': 'Farm Portions Polygons'}
        });
    },


    search: function (searchTerm) {
        let rel = config.extensionConfig.farmpolysSearch.search;
        let url = 'https://geocloud.envirogissolutions.co.za/api/v2/elasticsearch/search/envirogis/report/' + rel;
        let query = {
            "_source": {
                "excludes": [
                    //"properties.text"
                ]
            },
            "size": 100,
            "query": {
                "match": {
                    "properties.farmname": {
                        "query": searchTerm,
                        "operator": "and"
                    }
                }
            }
        };


        return new Promise(function (resolve, reject) {
            $.ajax({
                url: url,
                method: "POST",
                dataType: 'json',
                contentType: "application/json; charset=utf-8",
                data: JSON.stringify(query),
                scriptCharset: "utf-8",
                success: function (data) {
                    layerGroupAll.clearLayers();
                    let res = data.hits.hits.map((item) => {
                        let it = item._source.properties;
                        items[it.gid] = item._source;
                        let geom = item._source.geometry;
                        let layer = L.geoJson(geom, {
                            "color": "grey",
                            "weight": 1,
                            "opacity": 1,
                            "fillOpacity": 0.1,
                            "dashArray": '5,3'
                        });
                        layerGroupAll.addLayer(layer).addTo(mapObj);
                        return {'title': it.farmname, 'id': it.gid};
                    });
                    resolve(res);
                },
                error: function (response) {
                    reject();
                    alert(JSON.parse(response.responseText).message);
                }
            });

        });
    },

    handleMouseOver: function (searchTerm, res) {
        return new Promise(function (resolve, reject) {
            let geom = items[searchTerm].geometry;
            let layer = L.geoJson(geom, {
                "color": "blue",
                "weight": 1,
                "opacity": 1,
                "fillOpacity": 0.1,
                "dashArray": '5,3'
            });

            layerGroupMouseOver.clearLayers();
            layerGroupMouseOver.addLayer(layer).addTo(mapObj);
            resolve();
        });
    },

    handleMouseOut: function (searchTerm, res) {
        return new Promise(function (resolve, reject) {
            layerGroupMouseOver.clearLayers();
            resolve();
        });
    },

    handleSearch: function (searchTerm) {
        layerGroupAll.clearLayers();

        return new Promise(function (resolve, reject) {
            let geom = items[searchTerm].geometry;
            let properties = items[searchTerm].properties;
            let layer = L.geoJson(geom, {
                "color": "blue",
                "weight": 1,
                "opacity": 1,
                "fillOpacity": 0.1,
                "dashArray": '5,3'
            });

            layerGroupMouseOver.clearLayers();
            layerGroupMouseOver.addLayer(layer).addTo(mapObj);
            mapObj.fitBounds(layer.getBounds());
            let comp =
                <div className="panel panel-default">
                    <div className="panel-body">
                        <ul className="list-group">
                            <li className="list-group-item">
                                Name: {properties.farmname}
                            </li>
                            <li className="list-group-item">
                                Town: {properties.town}
                            </li>
                            <li className="list-group-item">
                                Municipality: {properties.munic}
                            </li>
                            <li className="list-group-item">
                                Province: {properties.province}
                            </li>
                            <li className="list-group-item">
                                Area: {properties.area}
                            </li>
                            <li className="list-group-item">
                                Report: {HTMLReactParser(properties.get_report)}
                            </li>
                        </ul>

                    </div>
                </div>;
            resolve(comp);
        });
    }
};
