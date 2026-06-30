import models from '../../../models/index.js';

const { Holiday } = models;

export const getAllHolidays = async (req, res) => {
  try {
    const holidays = await Holiday.findAll({
      order: [['holiday_date', 'ASC']]
    });
    res.status(200).json({ success: true, data: holidays });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createHoliday = async (req, res) => {
  try {
    const { holiday_date, description, holiday_type } = req.body;
    
    if (!holiday_date || !description) {
      return res.status(400).json({ success: false, message: 'Tanggal dan keterangan wajib diisi' });
    }

    const existing = await Holiday.findOne({ where: { holiday_date } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Sudah ada hari libur di tanggal ini' });
    }

    const holiday = await Holiday.create({
      holiday_date,
      description,
      holiday_type: holiday_type || 'NATIONAL_HOLIDAY'
    });

    res.status(201).json({ success: true, data: holiday, message: 'Berhasil menambahkan hari libur' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteHoliday = async (req, res) => {
  try {
    const { id } = req.params;
    const holiday = await Holiday.findByPk(id);
    
    if (!holiday) {
      return res.status(404).json({ success: false, message: 'Hari libur tidak ditemukan' });
    }

    await holiday.destroy();
    res.status(200).json({ success: true, message: 'Berhasil menghapus hari libur' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
