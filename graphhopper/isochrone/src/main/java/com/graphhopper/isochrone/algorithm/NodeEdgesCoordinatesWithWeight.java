package com.graphhopper.isochrone.algorithm;

import org.locationtech.jts.geom.Coordinate;

public class NodeEdgesCoordinatesWithWeight {
    public int weight;
    public Coordinate from;
    public Coordinate to;

    public NodeEdgesCoordinatesWithWeight(int weight, Coordinate from, Coordinate to) {
        this.weight = weight;
        this.from = from;
        this.to = to;
    }
}
