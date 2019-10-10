export enum Station {
    NORTH = 'North Station',
    SOUTH = 'South Station',
}

export enum Endpoint {
    ROUTES = 'routes',
    STOPS = 'stops',
}


export interface PredictionsResponse {
    data: Prediction[];
    included: Route | any;
}

export interface Prediction {
    type: 'prediction';
    attributes: {
        arrival_time: string | null;
        departure_time: string | null;
        direction_id: number;
        status: string | null;
        stop_sequence: number;
    },
    relationships: {
        alerts: any;
        route: RouteRelationship;
        schedule: any;
        stop: any;
        trip: any;
        vehicle: any;
    }
}

export interface RouteRelationship {
    data: {
        id: string;
        type: "route";
    }
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

export interface CompletePrediction {
    time: string | null;
    status: string | null;
    destination: string;
    first_stop: boolean;
    last_stop: boolean;
    line: string;
    line_color: string;
    line_text_color: string;
}