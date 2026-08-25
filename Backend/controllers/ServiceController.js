import Service from '../models/Service.js';

export async function getServices(req, res) {
  try {
    const services = await Service.find({ status: true });
    return res.json({ success: true, services });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function getAllServicesAdmin(req, res) {
  try {
    const services = await Service.find().sort({ createdAt: -1 });
    return res.json({ success: true, services });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function createService(req, res) {
  try {
    const { name, description, durationMinutes, price, status = true } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Service name is required' });

    const service = await Service.create({
      name,
      description,
      durationMinutes: Number(durationMinutes) || 30,
      price: Number(price) || 0,
      status,
    });
    return res.status(201).json({ success: true, service });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateService(req, res) {
  try {
    const { id } = req.params;
    const updated = await Service.findByIdAndUpdate(id, req.body, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: 'Service not found' });
    return res.json({ success: true, service: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function deleteService(req, res) {
  try {
    const { id } = req.params;
    const updated = await Service.findByIdAndUpdate(id, { status: false }, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: 'Service not found' });
    return res.json({ success: true, message: 'Service deactivated successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
