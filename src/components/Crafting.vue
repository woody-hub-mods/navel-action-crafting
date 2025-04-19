<template>
    <v-container v-if="!loading">
        <v-row justify="center">
            <v-col cols="12" md="6">
                <v-card>
                    <v-card-title>Select Component and Quantity</v-card-title>
                    <v-card-text>
                        <v-form>
                            <!-- Searchable and filterable dropdown -->
                            <v-select v-model="selectedComponent" autocomplete dense hide-details item-title="name"
                                item-value="id" :items="filteredNonResources" label="Select Component" outlined />
                            <v-text-field v-model="quantity" label="Enter Quantity" outlined type="number" />
                        </v-form>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>

        <!-- Card to Display Results -->
        <v-row v-if="results.resources && results.craftingOrder.length" justify="center">
            <v-col cols="12" md="8">
                <v-card>
                    <v-card-title>Crafting Results</v-card-title>
                    <v-card-text>
                        <!-- Explanation Section -->
                        <p style="margin-bottom: 20px;">
                            This section lists all raw resources required to produce the selected quantity of the item,
                            including the raw resources needed to create any dependent resources. Crafting batch sizes
                            are taken into account,
                            and batch sizes are rounded up to ensure the required quantity is met.
                        </p>

                        <h4>Resources Needed:</h4>


                        <v-list dense>
                            <v-list-item v-for="(amount, resource) in results.resources" :key="resource">
                                <v-list-item-title>
                                    <strong>{{ resource }}</strong>
                                </v-list-item-title>
                                <v-list-item-subtitle>
                                    <v-list dense>
                                        <v-list-item>
                                            <v-list-item-title>
                                                <strong>Amount Needed:</strong> {{ amount }}
                                            </v-list-item-title>
                                        </v-list-item>
                                        <v-list-item v-if="getItemDetails(resource)">
                                            <v-list-item-title>
                                                <strong>Buy Price:</strong> {{ getItemDetails(resource).buyPrice }}
                                            </v-list-item-title>
                                        </v-list-item>
                                        <v-list-item v-if="getItemDetails(resource)">
                                            <v-list-item-title>
                                                <strong>Weight:</strong> {{ getItemDetails(resource).weight }}
                                            </v-list-item-title>
                                        </v-list-item>
                                        <v-list-item v-if="getItemDetails(resource)">
                                            <v-list-item-title>
                                                <strong>Total Cost:</strong> {{
                                                    new
                                                        Intl.NumberFormat('en-US').format(Math.round(getItemDetails(resource).buyPrice
                                                            * amount))
                                                }}
                                            </v-list-item-title>
                                        </v-list-item>
                                        <v-list-item v-if="getItemDetails(resource)">
                                            <v-list-item-title>
                                                <strong>Total Weight:</strong> {{
                                                    Math.ceil(getItemDetails(resource).weight * amount)
                                                }}
                                            </v-list-item-title>
                                        </v-list-item>
                                    </v-list>
                                </v-list-item-subtitle>
                            </v-list-item>
                        </v-list>

                        <!-- Total Cost and Weight Section -->
                        <v-divider class="my-4" />
                        <h4 class="text-h6">Total Summary</h4>
                        <v-list dense>
                            <v-list-item>
                                <v-list-item-title>
                                    <strong>Total Cost:</strong> {{ calculateTotalCost() }}
                                </v-list-item-title>
                            </v-list-item>
                            <v-list-item>
                                <v-list-item-title>
                                    <strong>Total Weight:</strong> {{ calculateTotalWeight() }}
                                </v-list-item-title>
                            </v-list-item>
                        </v-list>


                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>

        <!-- Card for Production Steps -->
        <v-row v-if="craftingStepsExcludingLast.length" justify="center">
            <v-col cols="12" md="8">
                <v-card>
                    <v-card-title>Production Steps</v-card-title>
                    <v-card-text>
                        <v-list dense>
                            <v-list-item v-for="(step, index) in craftingStepsExcludingLast" :key="index">
                                <v-list-item-title>
                                    {{ index + 1 }}. {{ step.name }}
                                </v-list-item-title>
                                <ul style="margin-left: 20px; list-style-type: disc;">
                                    <li>Batches: {{ step.batches }}</li>
                                    <li>Batch Size: {{ step.batchSize }}</li>
                                    <li>Total Produced: {{ step.batches * step.batchSize }}</li>
                                    <li>Required Crafting Level: {{ step.requiredLevel }}</li>
                                </ul>
                            </v-list-item>
                        </v-list>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>

        <!-- Card for Final Product Production -->
        <v-row v-if="results.qtyAdjustedActualRecipe" justify="center">
            <v-col cols="12" md="8">
                <v-card>
                    <v-card-title class="text-h5">Final Product Details</v-card-title>

                    <v-card-text>
                        <!-- Final Product Overview -->
                        <p>
                            This section lists the final recipe used to produce the selected quantity of the item,
                            and lists all resources required to produce directly without any dependencies if you are
                            able to supply the crafter with the required resources directly by crafting dependencies on
                            your own.
                        </p>

                        <!-- Last Production Step Details -->
                        <v-divider class="my-4" />
                        <h4 class="text-h6">Last Production Step</h4>
                        <v-list v-if="lastProductionStep" dense>
                            <v-list-item>
                                <v-list-item-title><strong>Step Name:</strong> {{ lastProductionStep.name
                                    }}</v-list-item-title>
                            </v-list-item>
                            <v-list-item>
                                <v-list-item-title><strong>Batches:</strong> {{ lastProductionStep.batches
                                    }}</v-list-item-title>
                            </v-list-item>
                            <v-list-item>
                                <v-list-item-title><strong>Batch Size:</strong> {{ lastProductionStep.batchSize
                                    }}</v-list-item-title>
                            </v-list-item>
                            <v-list-item>
                                <v-list-item-title><strong>Total Produced:</strong> {{ lastProductionStep.batches *
                                    lastProductionStep.batchSize }}</v-list-item-title>
                            </v-list-item>
                            <v-list-item>
                                <v-list-item-title><strong>Required Crafting Level:</strong> {{
                                    lastProductionStep.requiredLevel }}</v-list-item-title>
                            </v-list-item>
                            <v-list-item>
                                <v-list-item-title><strong>Crafting XP:</strong> {{ results.qtyAdjustedActualRecipe.xp
                                    }}</v-list-item-title>
                            </v-list-item>
                        </v-list>

                        <!-- Recipe Details -->
                        <v-divider class="my-4" />
                        <h4 class="text-h6">Recipe Details</h4>
                        <v-list dense>
                            <v-list-item
                                v-for="(requirement, index) in results.qtyAdjustedActualRecipe.itemRequirements"
                                :key="index">
                                <v-list-item-title>
                                    <strong>{{ requirement.name }}</strong> - Amount Required - {{ requirement.amount *
                                        lastProductionStep.batches }}
                                </v-list-item-title>
                                <v-list-item-subtitle>
                                    <v-list dense>
                                        <v-list-item>
                                            <v-list-item-title>Batch Amount: {{ requirement.amount
                                                }}</v-list-item-title>
                                        </v-list-item>
                                        <v-list-item>
                                            <v-list-item-title>Type: {{ requirement.isResource ? 'Resource' :
                                                'Blueprint' }}</v-list-item-title>
                                        </v-list-item>
                                        <!-- <v-list-item>
                                            <v-list-item-title><strong>Total Amount Required:</strong> {{ requirement.amount * lastProductionStep.batches }}</v-list-item-title>
                                        </v-list-item> -->
                                    </v-list>
                                </v-list-item-subtitle>
                            </v-list-item>
                        </v-list>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>

        <!-- No Results Found Message -->
        <v-row v-else-if="results.resources && results.craftingOrder.length === 0" justify="center">
            <v-col cols="12" md="6">
                <v-card>
                    <v-card-title>No Results Found</v-card-title>
                    <v-card-text>Please select a valid component and quantity.</v-card-text>
                </v-card>
            </v-col>
        </v-row>
    </v-container>
    <v-container v-else>
        <v-row justify="center">
            <v-col cols="12" md="6">
                <v-card>
                    <v-card-title>Loading...</v-card-title>
                </v-card>
            </v-col>
        </v-row>
    </v-container>
</template>

<script>
export default {
    data() {
        return {
            recipes: [], // Holds the fetched recipes
            items: [], // Holds the fetched items
            selectedComponent: null, // Selected component from the dropdown
            quantity: null, // Quantity to craft
            loading: true, // Loading state
            results: {
                resources: null, // Stores the calculated resources
                craftingOrder: [], // Stores the crafting order
                qtyAdjustedActualRecipe: null,
            },
            debounceTimer: null, // Timer for debouncing the create method
        };
    },
    computed: {
        filteredNonResources() {
            const excludedGroups = ['Admirality']; // Groups to exclude
            const excludedNames = ['Art of Ship Handling', 'The Book of Five Rings', 'Gunnery Encyclopedia', 'Art of Ship Building']; // Names to exclude

            // Add items with "Blueprint" at the end of their name
            const blueprints = this.recipes
                .filter(group => !excludedGroups.includes(group.group)) // Exclude groups
                .flatMap(group => group.recipes) // Flatten recipes from groups
                .filter(
                    recipe =>
                        recipe.name.endsWith('Blueprint') && // Ensure it's a blueprint
                        !excludedNames.includes(recipe.result.name) // Exclude specific names
                )
                .map(recipe => ({
                    name: recipe.result.name.replace(' Blueprint', ''), // Remove "Blueprint" from the name
                    id: recipe.result.id,
                }));

            return blueprints;
        },
        lastProductionStep() {
            if (this.results.craftingOrder.length > 0) {
                return this.results.craftingOrder[this.results.craftingOrder.length - 1];
            }
            return null;
        },
        craftingStepsExcludingLast() {
            if (this.results.craftingOrder.length > 1) {
                return this.results.craftingOrder.slice(0, -1); // Exclude the last step
            }
            return [];
        },
    },
    watch: {
        quantity(newValue) {
            // Clear the previous debounce timer
            clearTimeout(this.debounceTimer);

            // If the quantity is valid and a component is selected, debounce the create method
            if (newValue > 0 && this.selectedComponent) {
                this.debounceTimer = setTimeout(() => {
                    this.create();
                }, 200);
            } else {
                // If the quantity is invalid or no component is selected, clear the results
                this.results.resources = null;
                this.results.qtyAdjustedActualRecipe = null;
                this.results.craftingOrder = [];
            }
        },
        selectedComponent(newValue) {
            // Clear the results if no component is selected
            if (!newValue || this.quantity <= 0) {
                this.results.resources = null;
                this.results.qtyAdjustedActualRecipe = null;
                this.results.craftingOrder = [];
            } else {
                // Trigger create if both selectedComponent and quantity are valid
                clearTimeout(this.debounceTimer);
                this.debounceTimer = setTimeout(() => {
                    this.create();
                }, 200);
            }
        },
    },
    async mounted() {
        try {
            await Promise.all([this.fetchRecipes(), this.fetchItems()]);

            // Prepopulate values from path parameters
            const { selectedComponent, quantity } = this.$route.params;

            // Set selectedComponent if present in path
            if (selectedComponent) {
                this.selectedComponent = parseInt(selectedComponent, 10);
            }

            // Default quantity to 1 if not provided or invalid
            this.quantity = quantity && parseInt(quantity, 10) > 0 ? parseInt(quantity, 10) : 1;

            // Trigger the create function if a component is selected
            if (this.selectedComponent) {
                this.create();
            }
        } catch (error) {
            console.error('Error during data fetching:', error);
        } finally {
            this.loading = false; // Set loading to false after data is fetched
        }
    },
    methods: {
        async fetchRecipes() {
            try {
                const response = await fetch('https://na-map-data-two.netlify.app//recipes.json');
                const data = await response.json();
                this.recipes = data;
            } catch (error) {
                console.error('Error fetching recipes:', error);
            }
        },
        async fetchItems() {
            try {
                const response = await fetch('https://na-map-data-two.netlify.app//eu2-items.json');
                const data = await response.json();
                this.items = data;
            } catch (error) {
                console.error('Error fetching recipes:', error);
            }
        },
        create() {
            if (this.selectedComponent && this.quantity > 0) {
                // Update the URL with path parameters
                this.$router.push({
                    name: 'Crafting',
                    params: {
                        selectedComponent: this.selectedComponent,
                        quantity: this.quantity,
                    },
                });

                const selectedBlueprint = this.filteredNonResources.find(
                    item => item.id === this.selectedComponent
                );
                if (selectedBlueprint) {
                    const result = this.calculateResourcesAndOrder(
                        this.recipes,
                        `${selectedBlueprint.name} Blueprint`,
                        this.quantity
                    );
                    this.results.resources = result.resources;
                    this.results.craftingOrder = result.craftingOrder;
                    this.results.qtyAdjustedActualRecipe = result.qtyAdjustedActualRecipe;
                } else {
                    console.error('Selected component not found.');
                }
            } else {
                console.error('Please select a component and enter a valid quantity.');
            }
        },
        // Get item details from the items array
        getItemDetails(resourceName) {
            return this.items.find(item => item.name === resourceName) || null;
        },
        // Calculate the total cost of all resources
        calculateTotalCost() {
            const total = Object.entries(this.results.resources).reduce((sum, [resource, amount]) => {
                const item = this.getItemDetails(resource);
                return item ? sum + item.buyPrice * amount : sum;
            }, 0);

            // Format the total with commas for better readability
            return new Intl.NumberFormat('en-US').format(Math.round(total));
        },
        // Calculate the total weight of all resources
        calculateTotalWeight() {
            const total = Object.entries(this.results.resources).reduce((sum, [resource, amount]) => {
                const item = this.getItemDetails(resource);
                return item ? sum + item.weight * amount : sum;
            }, 0);

            // Round up to the nearest whole number
            return Math.ceil(total);
        },
        calculateResourcesAndOrder(recipesJson, blueprintName, quantity) {
            const recipeMap = new Map();

            // Flatten the recipes into a map for quick lookup
            recipesJson.forEach(group => {
                group.recipes.forEach(recipe => {
                    recipeMap.set(recipe.name, recipe);
                });
            });

            const result = {
                resources: {}, // Tracks total resources required
                craftingOrder: new Map(), // Tracks the order of crafting with batch information
            };

            function calculateRequirements(blueprintName, quantityNeeded) {
                const recipe = recipeMap.get(blueprintName);

                if (!recipe) {
                    throw new Error(`Blueprint "${blueprintName}" not found.`);
                }

                // Calculate the number of batches required
                const batchSize = recipe.result.amount;
                const batches = Math.ceil(quantityNeeded / batchSize);

                // Process item requirements
                recipe.itemRequirements.forEach(requirement => {
                    const totalAmountNeeded = requirement.amount * batches;

                    if (requirement.isResource) {
                        // If it's a resource, add it to the resources list
                        if (!result.resources[requirement.name]) {
                            result.resources[requirement.name] = 0;
                        }
                        result.resources[requirement.name] += totalAmountNeeded;
                    } else {
                        // If it's not a resource, recursively calculate its requirements
                        const subBlueprintName = `${requirement.name} Blueprint`;
                        calculateRequirements(subBlueprintName, totalAmountNeeded);
                    }
                });

                // Combine duplicate steps in the crafting order
                if (result.craftingOrder.has(blueprintName)) {
                    const existingStep = result.craftingOrder.get(blueprintName);
                    existingStep.batches += batches; // Add to the existing batch count
                } else {
                    result.craftingOrder.set(blueprintName, {
                        name: blueprintName,
                        batches,
                        batchSize,
                        requiredLevel: recipe.requiredLevel, // Include the required crafting level
                    });
                }
            }

            // Start the calculation
            calculateRequirements(blueprintName, quantity);

            // Convert the crafting order map to an array and sort by required level
            const sortedCraftingOrder = Array.from(result.craftingOrder.values()).sort(
                (a, b) => a.requiredLevel - b.requiredLevel
            );


            const qtyAdjustedActualRecipe = JSON.parse(JSON.stringify(recipeMap.get(blueprintName)));

            return {
                resources: result.resources,
                craftingOrder: sortedCraftingOrder,
                qtyAdjustedActualRecipe,

            };
        },
    },
};
</script>

<style scoped>
.v-card {
    margin-top: 20px;
}
</style>
