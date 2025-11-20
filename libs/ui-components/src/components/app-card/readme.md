# app-card



<!-- Auto Generated Below -->


## Properties

| Property                   | Attribute     | Description                                          | Type                                      | Default        |
| -------------------------- | ------------- | ---------------------------------------------------- | ----------------------------------------- | -------------- |
| `description` _(required)_ | `description` | The card description text                            | `string`                                  | `undefined`    |
| `imageAlt`                 | `image-alt`   | Alt text for the image (defaults to "Card image")    | `string`                                  | `'Card image'` |
| `imageUrl`                 | `image-url`   | Optional image URL to display at the top of the card | `string`                                  | `undefined`    |
| `title` _(required)_       | `title`       | The card title                                       | `string`                                  | `undefined`    |
| `variant`                  | `variant`     | Card variant: default, highlighted, or compact       | `"compact" \| "default" \| "highlighted"` | `'default'`    |


## Events

| Event       | Description                      | Type                              |
| ----------- | -------------------------------- | --------------------------------- |
| `cardClick` | Emitted when the card is clicked | `CustomEvent<{ title: string; }>` |


## Slots

| Slot | Description                      |
| ---- | -------------------------------- |
|      | Custom content for the card body |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
