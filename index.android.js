"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var utils = require("tns-core-modules/utils/utils");
var ClusterManager = com.google.maps.android.clustering.ClusterManager;
var DefaultClusterRenderer = com.google.maps.android.clustering.view.DefaultClusterRenderer;
var HeatmapTileProvider = com.google.maps.android.heatmaps.HeatmapTileProvider;
var TileOverlayOptions = com.google.android.gms.maps.model.TileOverlayOptions;
var Gradient = com.google.maps.android.heatmaps.Gradient;
var LatLng = com.google.android.gms.maps.model.LatLng;
var LatLngBounds = com.google.android.gms.maps.model.LatLngBounds
var _mapView = {};
var heatmaps = {
    provider: "",
    overlay: "",
}
var Image = require('@nativescript/core/ui/image');
// function moveCamera(latitude, longitude) {
//     if (_mapView.gMap === undefined) {
//         console.log("NO INIT MAPVIEW")
//     } else {
//         try {
//             var cameraUpdate = new com.google.android.gms.maps.CameraUpdateFactory.newLatLng(new com.google.android.gms.maps.model.LatLng(latitude, longitude))
//             _mapView.gMap.animateCamera(cameraUpdate)
//         } catch (e) {
//             console.log(e)
//         }
//     }

// }
// exports.moveCamera = moveCamera;

/***************************************** CLUSTERING *****************************************/

const CustomClusterItem = java.lang.Object.extend({
    interfaces: [com.google.maps.android.clustering.ClusterItem],
    marker: null,
    init: function () { },
    getMarker: function () {
        return this.marker;
    },
    getPosition: function () {
        return this.marker.position.android;
    },
    getTitle: function () {
        return this.marker.title;
    },
    getSnippet: function () {
        return this.marker.snippet;
    },
});

function setupMarkerCluster(mapView,countItems,disabledClustering) {
    _mapView = mapView
    const CustomClusterRenderer = DefaultClusterRenderer.extend({
        init: function () { },
        onBeforeClusterItemRendered: function (item, markerOptions) {
            this.super.onBeforeClusterItemRendered(item, markerOptions);
            //set marker icon as cluster item icon
            markerOptions.icon(com.google.android.gms.maps.model.BitmapDescriptorFactory.fromBitmap(item.marker.icon.imageSource.android))
            console.log('[PoiRenderer] onBeforeClusterItemRendered')
        },
        onBeforeClusterRendered: function(clusterManager, markerOptions){
            this.super.onBeforeClusterRendered(clusterManager, markerOptions);
            // markerOptions.icon(com.google.android.gms.maps.model.BitmapDescriptorFactory.fromBitmap(item.marker.icon.imageSource.android))
            console.log('[PoiRenderer] onBeforeClusterRendered');
        },    
        onClusterItemRendered: function(item, marker) {
            this.super.onClusterItemRendered(item, marker);
            console.log('*****[PoiRenderer] onClusterItemRendered');
        },    
        onClusterRendered: function(cluster, marker) {
            console.log('[PoiRenderer] onClusterRendered');
            this.super.onClusterRendered(cluster, marker);
        },    
        onClusterItemUpdated: function(item, marker) {       
            this.super.onClusterItemUpdated(item, marker);
            //set marker icon as cluster item icon
            marker.setIcon(com.google.android.gms.maps.model.BitmapDescriptorFactory.fromBitmap(item.marker.icon.imageSource.android))
            console.log('[PoiRenderer] onClusterItemUpdated');
        },    
        onClusterUpdated: function(cluster, marker) {		
            this.super.onClusterUpdated(cluster, marker);
            console.log('[PoiRenderer] onClusterUpdated');
        },
        getClusterText: function(bucket){
            if (countItems){
                return bucket+"";
            }
            return this.super.getClusterText(bucket);
        },
        getBucket: function(cluster){
            if (countItems){
                return cluster.getSize();
            }
            return this.super.getBucket(cluster);
        },
        shouldRenderAsCluster: function(cluster) {
            return this.super.shouldRenderAsCluster(cluster) && !disabledClustering;
        }
    });
    var clusterManager = new ClusterManager(utils.ad.getApplicationContext(), _mapView.gMap);
    var renderer = new CustomClusterRenderer(utils.ad.getApplicationContext(), _mapView.gMap, clusterManager);
    clusterManager.mapView = _mapView;
    // if (_mapView.gMap.setOnCameraIdleListener) {
    //     _mapView.gMap.setOnCameraIdleListener(clusterManager);
    // }
    // else if (_mapView.gMap.setOnCameraChangeListener) {
    //     _mapView.gMap.setOnCameraChangeListener(clusterManager);
    // }
    clusterManager.setRenderer(renderer);
    _mapView.gMap.setOnInfoWindowClickListener(clusterManager);
    // _mapView.gMap.setOnMarkerClickListener(clusterManager);

    clusterManager.setOnClusterItemClickListener(new ClusterManager.OnClusterItemClickListener({
        onClusterItemClick: function (gmsMarker) {
            //returns tapped marker
            _mapView.notifyMarkerTapped(gmsMarker);
            return false;
        }
    }));

    // clusterManager.setOnClusterItemInfoWindowClickListener(new ClusterManager.OnClusterItemInfoWindowClickListener({
    //     onClusterItemInfoWindowClick: function (gmsMarker) {
    //         var marker = markers.find(mk => mk.android.getPosition() === gmsMarker.getPosition());
    //         marker && _mapView.notifyMarkerTapped(marker);
    //         return false;
    //     }
    // }));

    clusterManager.setOnClusterClickListener(new ClusterManager.OnClusterClickListener({
        //return the array of the markers in the cluster
        onClusterClick: function (cluster) {
            var listeMarker = cluster.getItems().toArray();
            var map = _mapView.gMap;
            var minLat;
            var minLon;
            var maxLat;
            var maxLon;
            for (var i = 0; i < listeMarker.length; i++) {
                var marker = listeMarker[i];
                var p = marker.getPosition();
                if (!minLat || p.latitude < minLat)
                    minLat = p.latitude;
                if (!minLon || p.longitude < minLon)
                    minLon = p.longitude;
                if (!maxLat || p.latitude > maxLat)
                    maxLat = p.latitude;
                if (!maxLon || p.longitude > maxLon)
                    maxLon = p.longitude;
            }
            var bounds = new LatLngBounds(
                new LatLng(minLat, minLon),
                new LatLng(maxLat, maxLon)
            );
            var cu = new com.google.android.gms.maps.CameraUpdateFactory.newLatLngBounds(bounds, 100);
            map.moveCamera(cu);
            _mapView.notifyMarkerTapped(listeMarker);
            return false;
        }
        
        // onClusterClick: function (cluster) {
        //     var listeMarker = cluster.getItems().toArray();
        //     var resultListeMarkers = [];
        //     for (var i = 0; i < listeMarker.length; i++) {
                    //Perché fa questa cosa e non prende direttamente il marker?
        //         resultListeMarkers.push(markers.find(mk => mk.android.getPosition() === listeMarker[i].getPosition()))
                    //Perché non lo mette dopo il for?
        //         if (i === listeMarker.length - 1) {
        //             _mapView.notifyMarkerTapped(resultListeMarkers);
        //             return false;
        //         }
        //     }
        // }
    }));
    return clusterManager;
}
exports.setupMarkerCluster = setupMarkerCluster;

//listener(marker)
// function setItemClickListener(clusterManager, listener) {
//     _mapView.gMap.setOnMarkerClickListener(clusterManager);
//     clusterManager.setOnClusterItemClickListener(new ClusterManager.OnClusterItemClickListener({        
//         onClusterItemClick: function(marker) {
//             console.log("SCHIANTA?")
//             listener(marker);
//         }
//     }));   
// }
// exports.setItemClickListener = setItemClickListener;

function updateItem(clusterManager, marker) {
    clusterManager.updateItem(marker);
}
exports.updateItem = updateItem;

function cluster(clusterManager) {
    clusterManager.cluster();
}
exports.cluster = cluster;

function addItems(clusterManager, markers) {
    var arrayMarker = new java.util.ArrayList()
    for (var i = 0; i < markers.length; i++) {
        var markerItem = new CustomClusterItem();
        markerItem.marker = markers[i];
        arrayMarker.add(markerItem);
    }
    clusterManager.clearItems();
    clusterManager.addItems(arrayMarker);
    clusterManager.cluster();
}
exports.addItems = addItems;

function addItem(clusterManager, marker) {
    var markerItem = new CustomClusterItem();
    markerItem.marker = marker;            
    clusterManager.addItem(markerItem)    
}
exports.addItem = addItem;

function clearMap() {
    clusterManager.clearMap();
}
exports.clearMap = clearMap;

/***************************************** HEATMAP *****************************************/

function setupHeatmap(mapView, positions, colors, startPoints) {
    var list = new java.util.ArrayList();
    positions.forEach(function (position) {
        list.add(position.android);
    });
    var colrs = Array.create("int", 2);
    colrs[0] = colors[0].android;
    colrs[1] = colors[1].android;
    var sttPoints = Array.create("float", 2);
    sttPoints[0] = startPoints[0];
    sttPoints[1] = startPoints[1];
    var gradient = new Gradient(colrs, sttPoints);
    heatmaps.provider = new HeatmapTileProvider.Builder()
        .data(list)
        .gradient(gradient)
        .build();
    heatmaps.overlay = mapView.gMap.addTileOverlay(new TileOverlayOptions().tileProvider(heatmaps.provider));
    return heatmaps
}
exports.setupHeatmap = setupHeatmap;

function setOpacity(value) {
    heatmaps.provider.setOpacity(value)
}
exports.setOpacity = setOpacity;

function setRadius(value) {
    heatmaps.provider.setRadius(value)
}
exports.setRadius = setRadius;

function removeHeatmap() {
    heatmaps.provider.remove()
}
exports.removeHeatmap = removeHeatmap;
//# sourceMappingURL=index.android.js.map