'use strict';
 
const { Contract } = require('fabric-contract-api');
 
class CoffeeContract extends Contract {
 
    async CreateBatch(ctx, id, type, quantity, owner) {
        const exists = await this.BatchExists(ctx, id);
        if (exists) {
            throw new Error(`The batch ${id} already exists`);
        }
        const batch = {
            ID: id,
            Type: type,
            Quantity: parseInt(quantity),
            Owner: owner,
            Status: 'Harvested',
        };
        await ctx.stub.putState(id, Buffer.from(JSON.stringify(batch)));
        return JSON.stringify(batch);
    }
 
    async ReadBatch(ctx, id) {
        const batchJSON = await ctx.stub.getState(id);
        if (!batchJSON || batchJSON.length === 0) {
            throw new Error(`The batch ${id} does not exist`);
        }
        return batchJSON.toString();
    }
 
    async UpdateStatus(ctx, id, newStatus) {
        const allowed = ['Harvested', 'InTransit', 'Delivered', 'Sold'];
        if (!allowed.includes(newStatus)) {
            throw new Error(`Status must be one of: ${allowed.join(', ')}`);
        }
        const batchString = await this.ReadBatch(ctx, id);
        const batch = JSON.parse(batchString);
        batch.Status = newStatus;
        await ctx.stub.putState(id, Buffer.from(JSON.stringify(batch)));
        return JSON.stringify(batch);
    }
 
    async TransferBatch(ctx, id, newOwner) {
        const batchString = await this.ReadBatch(ctx, id);
        const batch = JSON.parse(batchString);
        const oldOwner = batch.Owner;
        batch.Owner = newOwner;
        await ctx.stub.putState(id, Buffer.from(JSON.stringify(batch)));
        return oldOwner;
    }
 
    async BatchExists(ctx, id) {
        const batchJSON = await ctx.stub.getState(id);
        return batchJSON && batchJSON.length > 0;
    }
 
    async GetAllBatches(ctx) {
        const allResults = [];
        const iterator = await ctx.stub.getStateByRange('', '');
        let result = await iterator.next();
        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                record = strValue;
            }
            allResults.push(record);
            result = await iterator.next();
        }
        return JSON.stringify(allResults);
    }
}
 
module.exports = CoffeeContract;
