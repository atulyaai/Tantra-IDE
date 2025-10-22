import express from 'express';
import * as databaseService from '../services/databaseService.js';

const router = express.Router();

router.get('/connections', async (req, res, next) => {
  try {
    const connections = await databaseService.detectDatabaseConnections();
    res.json({ success: true, data: connections });
  } catch (error) {
    next(error);
  }
});

router.post('/test', async (req, res, next) => {
  try {
    const { connection } = req.body;
    if (!connection) {
      return res.status(400).json({ success: false, error: 'Connection is required' });
    }
    
    const isConnected = await databaseService.testConnection(connection);
    res.json({ success: true, data: { connected: isConnected } });
  } catch (error) {
    next(error);
  }
});

router.post('/query', async (req, res, next) => {
  try {
    const { connection, query } = req.body;
    if (!connection || !query) {
      return res.status(400).json({ success: false, error: 'Connection and query are required' });
    }
    
    const result = await databaseService.executeQuery(connection, query);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

router.get('/schema/:connectionId', async (req, res, next) => {
  try {
    const { connectionId } = req.params;
    const { connection } = req.body;
    
    if (!connection) {
      return res.status(400).json({ success: false, error: 'Connection is required' });
    }
    
    const schema = await databaseService.getDatabaseSchema(connection);
    res.json({ success: true, data: schema });
  } catch (error) {
    next(error);
  }
});

router.post('/query-builder/select', async (req, res, next) => {
  try {
    const { table, columns, where } = req.body;
    if (!table) {
      return res.status(400).json({ success: false, error: 'Table is required' });
    }
    
    const query = databaseService.buildSelectQuery(table, columns, where);
    res.json({ success: true, data: { query } });
  } catch (error) {
    next(error);
  }
});

router.post('/query-builder/insert', async (req, res, next) => {
  try {
    const { table, data } = req.body;
    if (!table || !data) {
      return res.status(400).json({ success: false, error: 'Table and data are required' });
    }
    
    const query = databaseService.buildInsertQuery(table, data);
    res.json({ success: true, data: { query } });
  } catch (error) {
    next(error);
  }
});

router.post('/query-builder/update', async (req, res, next) => {
  try {
    const { table, data, where } = req.body;
    if (!table || !data || !where) {
      return res.status(400).json({ success: false, error: 'Table, data, and where are required' });
    }
    
    const query = databaseService.buildUpdateQuery(table, data, where);
    res.json({ success: true, data: { query } });
  } catch (error) {
    next(error);
  }
});

router.post('/query-builder/delete', async (req, res, next) => {
  try {
    const { table, where } = req.body;
    if (!table || !where) {
      return res.status(400).json({ success: false, error: 'Table and where are required' });
    }
    
    const query = databaseService.buildDeleteQuery(table, where);
    res.json({ success: true, data: { query } });
  } catch (error) {
    next(error);
  }
});

export default router;
