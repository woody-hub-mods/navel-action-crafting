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
                                item-value="id" :items="filteredNonResources" label="Select Component or Ship" outlined />
                            <v-text-field v-model="quantity" label="Enter Quantity" outlined type="number" />
                            <!-- Conditional dropdowns for Ship -->
                            <v-select
                                v-if="isSelectedShip"
                                v-model="selectedFrame"
                                autocomplete
                                dense
                                hide-details
                                item-title="name"
                                item-value="id"
                                :items="formattedWoodFrame"
                                label="Select Frame"
                                outlined
                            />
                            <v-select
                                v-if="isSelectedShip"
                                v-model="selectedTrim"
                                autocomplete
                                dense
                                hide-details
                                item-title="name"
                                item-value="id"
                                :items="formattedWoodTrim"
                                label="Select Planking"
                                outlined
                            />
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
                            <v-list-item v-if="lastProductionStep.isShip">
                                <v-list-item-title><strong>shipyard Level:</strong> {{
                                    lastProductionStep.shipyardLevel }}</v-list-item-title>
                            </v-list-item>
                            <v-list-item>
                                <v-list-item-title><strong>Crafting XP:</strong> {{ results.qtyAdjustedActualRecipe.xp
                                    }}</v-list-item-title>
                            </v-list-item>
                        </v-list>

                        <!-- Recipe Details -->
                        <v-divider class="my-4" />
                        <h4 class="text-h6">Recipe Details</h4>

                        <!-- Disclaimer for Frame and Planking Wood -->
                        <v-alert type="info" dense class="mb-4">
                            Frame and Planking wood selection requirements are not included in this section yet but is included in the Resources Needed section. Will fix this on future patch.
                        </v-alert>

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


    <!-- Shout-Out Section -->
    <ShoutOut />

</template>

<script>
export default {
    data() {
        return {
            recipes: [], // Holds the fetched recipes
            items: [], // Holds the fetched items
            woods: [], // Holds the fetched woods
            selectedComponent: null, // Selected component from the dropdown
            selectedFrame: null, // Selected frame for ship crafting
            selectedTrim: null, // Selected planking for ship crafting
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
                    isShip: !!recipe.isShip, // Check if it's a ship
                }));

            return blueprints;
        },
        filterWoodTrim() {
            return this.woods.trim;
        },
        formattedWoodTrim() {
            return this.filterWoodTrim
                .map(item => {
                    const modifiers = item.properties
                        .map(prop => `${prop.modifier} ${prop.amount}${prop.isPercentage ? "%" : ""}`)
                        .join(", ");
                    return {
                        id: item.id,
                        name: `${item.name} - ${item.family} (${modifiers})`,
                        family: item.family // Keep track of the family for sorting
                    };
                })
                .sort((a, b) => {
                    // First, prioritize "regular" over "rare"
                    if (a.family === "regular" && b.family !== "regular") return -1;
                    if (b.family === "regular" && a.family !== "regular") return 1;
                    // Then, sort alphabetically by name
                    return a.name.localeCompare(b.name);
                });
        },
        filterWoodFrame() {
            return this.woods.frame;
        },
        formattedWoodFrame() {
            return this.filterWoodFrame
                .map(item => {
                    const modifiers = item.properties
                        .map(prop => `${prop.modifier} ${prop.amount}${prop.isPercentage ? "%" : ""}`)
                        .join(", ");
                    return {
                        id: item.id,
                        name: `${item.name} - ${item.family} (${modifiers})`,
                        family: item.family // Keep track of the family for sorting
                    };
                })
                .sort((a, b) => (a.family === "regular" ? -1 : 1)); // Ensure "regular" comes first
        },
        getSelectedWoodFrame() {
            return this.filterWoodFrame.find(item => item.id === this.selectedFrame);
        },
        getSelectedWoodTrim() {
            return this.filterWoodTrim.find(item => item.id === this.selectedTrim);
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
        isSelectedShip() {
            const selected = this.filteredNonResources.find(item => item.id === this.selectedComponent);
            return selected?.isShip || false;
        }
    },
    watch: {
        quantity(newValue) {
            if (newValue > 0 && this.selectedComponent) {
                const selectedItem = this.filteredNonResources.find(item => item.id === this.selectedComponent);
                if (selectedItem?.isShip) {
                    if (this.selectedFrame && this.selectedTrim) {
                        this.create();
                    } else {
                        this.clearResults();
                    }
                } else {
                    this.create();
                }
            } else {
                this.clearResults();
            }
        },

        selectedComponent(newValue) {
            if (!newValue) {
                this.clearResults();
                return;
            }

            const selectedItem = this.filteredNonResources.find(item => item.id === newValue);

            if (selectedItem?.isShip) {
                this.quantity = 1;
                this.clearResults(); 
                if (this.isSelectedShip && this.selectedFrame && this.selectedTrim && this.quantity > 0) {
                    this.create(); // Call create if all conditions are met
                }
            } else {
                this.selectedFrame = null;
                this.selectedTrim = null;
                const recipe = this.recipes.flatMap(group => group.recipes).find(r => r.result.id === newValue);
                this.quantity = recipe?.result?.amount || 1;
                this.create();
            }
        },

        selectedFrame(newValue) {
            if (this.isSelectedShip && newValue && this.selectedTrim && this.quantity > 0) {
                this.create();
            } else {
                this.clearResults();
            }
        },

        selectedTrim(newValue) {
            if (this.isSelectedShip && newValue && this.selectedFrame && this.quantity > 0) {
                this.create();
            } else {
                this.clearResults();
            }
        }
    },
    async mounted() {
        try {
            await Promise.all([
                this.fetchRecipes(),
                this.fetchItems(),
                this.fetchShipBlueprints(),
                this.fetchIngredients(),
                this.fetchWoods()
            ]);

            // Map ingredient names for quick lookup
            const ingredientNames = new Set(
                this.ingredients
                    .filter(ing => ing.name !== "Doubloons") // Exclude "Doubloons" from the set
                    .map(ing => ing.name)
            );

            // Transform ship blueprints into recipe format with adjusted IDs
            const shipBlueprintRecipes = {
                group: "Ship Construction",
                recipes: this.shipsBlueprints
                .filter(ship => !ship.ship.name.endsWith("(i)"))
                .map(ship => ({
                    id: ship.id + 10000, // Add 10000 to ship ID to avoid conflicts
                    isShip: true,
                    name: `${ship.name} Blueprint`,
                    goldPrice: ship.price, 
                    wood: ship.wood,
                    itemRequirements: [
                        ...ship.resources.map(resource => ({
                            id: resource.id || null, // Some resource names may not have IDs
                            name: resource.name,
                            amount: resource.amount,
                            isResource: !ingredientNames.has(resource.name) // Check if it's in ingredients
                        })),
                        {
                            id: null, // No specific ID for provisions
                            name: "Provisions",
                            amount: ship.provisions,
                            isResource: true
                        }
                    ],
                    result: {
                        id: ship.ship.id + 10000, // Adjust ship result ID to avoid conflicts
                        name: ship.ship.name,
                        amount: 1,
                        craftingCost: 0, // You may need a formula for this
                        reduction: 0 // Adjust accordingly
                    },
                    requiredLevel: ship.craftLevel,
                    xp: ship.craftXP,
                    shipyardLevel: ship.shipyardLevel,
                    serverType: -1
                }))
            };

            // Add transformed ship blueprints to recipes
            this.recipes.push(shipBlueprintRecipes);

            // Prepopulate values from path parameters
            const { selectedComponent, quantity, selectedTrim, selectedFrame } = this.$route.params;

            if (selectedComponent) {
                this.selectedComponent = parseInt(selectedComponent, 10);
            }

            if (selectedTrim) {
                this.selectedTrim = parseInt(selectedTrim, 10);
            }
            if (selectedFrame) {
                this.selectedFrame = parseInt(selectedFrame, 10);
            }

            this.quantity = quantity && parseInt(quantity, 10) > 0 ? parseInt(quantity, 10) : 1;

            if (this.selectedComponent) {
                this.create();
            }
        } catch (error) {
            console.error("Error during data fetching:", error);
        } finally {
            this.loading = false;
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
        async fetchShipBlueprints() {
            try {
                const response = await fetch('https://na-map-data-two.netlify.app//ship-blueprints.json');
                const data = await response.json();
                this.shipsBlueprints = data;
            } catch (error) {
                console.error('Error fetching ship blueprints:', error);
            }
        },
        async fetchIngredients() {
            try {
                const response = await fetch('https://na-map-data-two.netlify.app//ingredients.json');
                const data = await response.json();
                this.ingredients = data;
            } catch (error) {
                console.error('Error fetching ingredients:', error);
            }
        },
        async fetchWoods() {
            try {
                const response = await fetch('https://na-map-data-two.netlify.app//woods.json');
                const data = await response.json();
                this.woods = data;
            } catch (error) {
                console.error('Error fetching ingredients:', error);
            }
        },
        clearResults() {
            this.results.resources = null;
            this.results.qtyAdjustedActualRecipe = null;
            this.results.craftingOrder = [];
        },
        create() {
            if (this.selectedComponent && this.quantity > 0) {
                // Update the URL with path parameters
                this.$router.push({
                    name: 'Crafting',
                    params: {
                        selectedComponent: this.selectedComponent,
                        quantity: this.quantity,
                        selectedTrim: this.selectedTrim,
                        selectedFrame: this.selectedFrame
                    },
                });

                const selectedBlueprint = this.filteredNonResources.find(
                    item => item.id === this.selectedComponent
                );
                if (selectedBlueprint) {
                    const result = this.calculateResourcesAndOrder(
                        this.recipes,
                        `${selectedBlueprint.name} Blueprint`,
                        this.quantity,
                        this.getSelectedWoodFrame,
                        this.getSelectedWoodTrim
                    );
                    this.results.resources = result.resources;
                    this.results.craftingOrder = result.craftingOrder;
                    this.results.qtyAdjustedActualRecipe = result.qtyAdjustedActualRecipe;
                } else {
                    console.error('Selected component not found.');
                }

                // Google Analytics event for component change
                if (window.gtag) {
                    gtag('event', 'component_change', {
                        event_category: 'Crafting',
                        event_label: 'Component Changed',
                        value: this.selectedComponent,
                        woodTrim: this.selectedTrim,
                        woodFrame: this.selectedFrame,
                        quantity: this.quantity,
                    });
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
        calculateResourcesAndOrder(recipesJson, blueprintName, quantity, frame, trim) {
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

                // Define mapping for wood names between woods and items
                const woodNameMap = {
                    "Oak": "Oak Log",
                    "Fir": "Fir Log",
                    "Teak": "Teak Log",
                    "White Oak": "White Oak Log",
                    "Mahogany": "Mahogany Log",
                    "Live Oak": "Live Oak Log",
                    // Add more mappings as needed
                };


                // Calculate the number of batches required
                const batchSize = recipe.result.amount;
                const batches = Math.ceil(quantityNeeded / batchSize);

                // Get wood amounts
                if (recipe.isShip && recipe.wood) {
                    console.log("Ship recipe found:", recipe);
                    const woodFrame = recipe.wood.find(wood => wood.name === "Frame");
                    const woodTrim = recipe.wood.find(wood => wood.name === "Trim");
                    
                    // Get the base amount of fir needed, each ship requires it and amount is used for trims
                    const baseFirAmount = recipe.itemRequirements.find(item => item.name === "Fir")?.amount || 0;

                    // Add Trim resource and amount to the result
                    if (trim.name === "Crew Space") {
                        // Add Hemp using the fir amount
                        const hempAmount = Math.ceil(baseFirAmount * batches);
                        if (!result.resources["Hemp"]) {
                            result.resources["Hemp"] = 0;
                        }
                        result.resources["Hemp"] += hempAmount;
                    } else {
                        // Add selected wood
                        const name = woodNameMap[trim.name] || trim.name;
                        if(!result.resources[name]) {
                            result.resources[name] = 0;
                        }
                        result.resources[name] += Math.ceil(baseFirAmount * batches);
                    }

                    // Add Frame resource and amount to the result
                    const name = woodNameMap[frame.name] || frame.name;
                    if (!result.resources[name]) {
                        result.resources[name] = 0;
                    }
                    result.resources[name] += Math.ceil(woodFrame.amount * batches);

                }

                // Process item requirements
                recipe.itemRequirements.forEach(requirement => {
                    const totalAmountNeeded = requirement.amount * batches;

                    if (requirement.isResource) {
                        // If it's a resource, add it to the resources list
                        const name = woodNameMap[requirement.name] || requirement.name;
                        if (!result.resources[name]) {
                            result.resources[name] = 0;
                        }
                        result.resources[name] += totalAmountNeeded;
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
