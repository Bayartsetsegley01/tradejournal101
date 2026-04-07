export const getJournal = async (req, res) => {
  try {
    const { tradeId } = req.params;
    res.json({ success: true, data: { tradeId, notes: "Journal entry details" } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const saveJournal = async (req, res) => {
  try {
    const { tradeId } = req.params;
    res.json({ success: true, data: { tradeId, message: "Journal saved successfully" } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
