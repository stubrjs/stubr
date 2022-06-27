import { OpenAPIV3 } from 'openapi-types';

const extractExample: Function = (
    mediaTypeObject: OpenAPIV3.MediaTypeObject
): any | undefined => {
    // if single example defined - it wins
    if (mediaTypeObject?.example) {
        return mediaTypeObject?.example;
    }

    // if array of examples present: pick first one
    if (mediaTypeObject?.examples) {
        const firstExample: OpenAPIV3.ExampleObject = mediaTypeObject
            ?.examples?.[0] as OpenAPIV3.ExampleObject;

        if (firstExample.value) {
            return firstExample.value;
        }
    }

    if (mediaTypeObject?.schema) {
        const schema: OpenAPIV3.SchemaObject =
            mediaTypeObject?.schema as OpenAPIV3.SchemaObject;

        // check schema of type array
        if (
            schema?.type === 'array' &&
            (schema?.items as OpenAPIV3.SchemaObject)?.example
        ) {
            // return example as one item of an array
            return [(schema?.items as OpenAPIV3.SchemaObject)?.example];
        }

        // if schema not being an array return example if defined
        if (schema?.example) {
            return schema.example;
        }
    }
};

export { extractExample };
