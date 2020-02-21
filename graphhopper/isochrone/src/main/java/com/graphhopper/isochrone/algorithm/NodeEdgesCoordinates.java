package com.graphhopper.isochrone.algorithm;

import org.locationtech.jts.geom.Coordinate;

public class NodeEdgesCoordinates {
    public Coordinate from;
    public Coordinate to;

    public NodeEdgesCoordinates(Coordinate from, Coordinate to) {
        this.from = from;
        this.to = to;
    }
}
