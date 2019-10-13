export enum Station {
    NORTH = 'place-north',
    SOUTH = 'place-sstat',
}

export enum Endpoint {
    ROUTES = 'routes',
    STOPS = 'stops',
}

export interface PredictionsResponse {
    data: Prediction[];
    included: Route | any;
}

export interface StopResponse {
    data: Stop;
}

export type Resource = Stop | Prediction | Route | Vehicle | Trip;

export interface Stop {
    attributes: {
        name: string;
        vehicle_type: number;
        platform_code: string;
    };
    type: 'stop';
    id: string;
}

export interface Prediction {
    type: 'prediction';
    id: string;
    attributes: {
        arrival_time: string | null;
        departure_time: string | null;
        direction_id: number;
        status: string | null;
        stop_sequence: number;
    };
    relationships: {
        alerts: Relationship;
        route: Relationship;
        schedule: Relationship;
        stop: Relationship;
        trip: Relationship;
        vehicle: Relationship;
    };
}

export interface Relationship {
    data: {
        id: string;
        type: string;
    }
}

export interface Vehicle {
    attributes: {
        current_status: string;
    };
    type: 'vehicle';
    id: string;
}

export interface Route {
    attributes: {
        color: string;
        description: string;
        direction_destinations: string[];
        direction_names: string[];
        fare_class: string;
        long_name: string;
        short_name: string;
        sort_order: number;
        text_color: string;
        type: number;
    }
    id: string;
    type: 'route';
}

export interface Trip {
    type: 'trip';
    id: string;
    attributes: {
        headsign: string;
    };
}

export interface CompletePrediction {
    time: string;
    status: string;
    first_stop: boolean;
    last_stop: boolean;
    stop: Stop;
    vehicle: Vehicle;
    route: Route;
    trip: Trip;
}