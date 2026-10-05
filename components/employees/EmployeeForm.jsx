import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  Typography,
  Alert,
  IconButton,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import PersonAddIcon from "@mui/icons-material/PersonAdd";

export default function EmployeeForm({
  form = {},
  onFormChange = () => {},
  onSubmit = () => {},
  loading = false,
  error = "",
  onErrorClose = () => {},
  submitButtonText =
    "Add Employee",
  title = "Add New Employee",
  isEditing = false,
  showIcon = true,
}) {
  const handleChange = (event) => {
    const { name, value } =
      event.target;
    onFormChange({ name, value });
  };

  return (
    <Card
      sx={{
        mb: 4,
        borderRadius: "16px",
        boxShadow:
          "0 4px 6px rgba(0, 0, 0, 0.07), 0 10px 13px rgba(0, 0, 0, 0.05)",
        border:
          "1px solid rgba(255, 255, 255, 0.5)",
        background:
          "linear-gradient(to bottom, #ffffff 0%, #f9fafb 100%)",
        transition:
          "transform 0.2s, box-shadow 0.2s",

        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow:
            "0 8px 12px rgba(0, 0, 0, 0.1), 0 12px 20px rgba(0, 0, 0, 0.08)",
        },
      }}
    >
      <CardContent
        sx={{ p: { xs: 2.5, md: 3.5 } }}
      >
        {/* Form Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            mb: 3,
          }}
        >
          {showIcon && (
            <Box
              sx={{
                p: 1,
                borderRadius: "10px",
                backgroundColor:
                  "#ede9fe",
              }}
            >
              <PersonAddIcon
                sx={{
                  color: "#7c3aed",
                  fontSize: 24,
                }}
              />
            </Box>
          )}
          <Typography
            variant="h5"
            sx={{
              fontWeight: 600,
              color: "#1a1a2e",
            }}
          >
            {title}
          </Typography>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert
            severity="error"
            sx={{
              mb: 3,
              borderRadius: "8px",
              border: "1px solid #fecaca",
              backgroundColor:
                "#fef2f2",
              color: "#7f1d1d",
              "& .MuiAlert-action": {
                p: 0,
              },
            }}
            action={
              <IconButton
                size="small"
                color="inherit"
                onClick={onErrorClose}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            }
          >
            {error}
          </Alert>
        )}

        {/* Form */}
        <Box
          component="form"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
        >
          <Grid
            container
            spacing={2.5}
          >
            {/* Employee ID */}
            <Grid
              size={{ xs: 12, md: 6 }}
            >
              <TextField
                fullWidth
                label="Employee ID"
                name="employeeId"
                value={
                  form.employeeId || ""
                }
                onChange={handleChange}
                placeholder="EMP-007"
                required
                disabled={
                  isEditing
                }
                variant="outlined"
                sx={{
                  "& .MuiOutlinedInput-root":
                    {
                      borderRadius:
                        "10px",
                      backgroundColor:
                        "#f9fafb",
                      transition:
                        "background-color 0.2s",

                      "&:hover": {
                        backgroundColor:
                          "#f3f4f6",
                      },

                      "&.Mui-focused":
                        {
                          backgroundColor:
                            "#ffffff",
                        },
                    },
                }}
              />
            </Grid>

            {/* Employee Name */}
            <Grid
              size={{ xs: 12, md: 6 }}
            >
              <TextField
                fullWidth
                label="Employee Name"
                name="employeeName"
                value={
                  form.employeeName ||
                  ""
                }
                onChange={handleChange}
                required
                variant="outlined"
                sx={{
                  "& .MuiOutlinedInput-root":
                    {
                      borderRadius:
                        "10px",
                      backgroundColor:
                        "#f9fafb",
                      transition:
                        "background-color 0.2s",

                      "&:hover": {
                        backgroundColor:
                          "#f3f4f6",
                      },

                      "&.Mui-focused":
                        {
                          backgroundColor:
                            "#ffffff",
                        },
                    },
                }}
              />
            </Grid>

            {/* Employee Email */}
            <Grid
              size={{ xs: 12, md: 6 }}
            >
              <TextField
                fullWidth
                type="email"
                label="Employee Email"
                name="employeeEmail"
                value={
                  form.employeeEmail ||
                  ""
                }
                onChange={handleChange}
                required
                variant="outlined"
                sx={{
                  "& .MuiOutlinedInput-root":
                    {
                      borderRadius:
                        "10px",
                      backgroundColor:
                        "#f9fafb",
                      transition:
                        "background-color 0.2s",

                      "&:hover": {
                        backgroundColor:
                          "#f3f4f6",
                      },

                      "&.Mui-focused":
                        {
                          backgroundColor:
                            "#ffffff",
                        },
                    },
                }}
              />
            </Grid>

            {/* Department */}
            <Grid
              size={{ xs: 12, md: 6 }}
            >
              <TextField
                fullWidth
                label="Department"
                name="department"
                value={
                  form.department ||
                  ""
                }
                onChange={handleChange}
                variant="outlined"
                sx={{
                  "& .MuiOutlinedInput-root":
                    {
                      borderRadius:
                        "10px",
                      backgroundColor:
                        "#f9fafb",
                      transition:
                        "background-color 0.2s",

                      "&:hover": {
                        backgroundColor:
                          "#f3f4f6",
                      },

                      "&.Mui-focused":
                        {
                          backgroundColor:
                            "#ffffff",
                        },
                    },
                }}
              />
            </Grid>

            {/* Designation */}
            <Grid
              size={{ xs: 12, md: 6 }}
            >
              <TextField
                fullWidth
                label="Designation"
                name="designation"
                value={
                  form.designation ||
                  ""
                }
                onChange={handleChange}
                variant="outlined"
                sx={{
                  "& .MuiOutlinedInput-root":
                    {
                      borderRadius:
                        "10px",
                      backgroundColor:
                        "#f9fafb",
                      transition:
                        "background-color 0.2s",

                      "&:hover": {
                        backgroundColor:
                          "#f3f4f6",
                      },

                      "&.Mui-focused":
                        {
                          backgroundColor:
                            "#ffffff",
                        },
                    },
                }}
              />
            </Grid>

            {/* Casual Leave */}
            <Grid
              size={{ xs: 12, md: 6 }}
            >
              <TextField
                fullWidth
                type="number"
                label="Casual Leave"
                name="casualLeave"
                value={
                  form.casualLeave || 0
                }
                onChange={handleChange}
                variant="outlined"
                sx={{
                  "& .MuiOutlinedInput-root":
                    {
                      borderRadius:
                        "10px",
                      backgroundColor:
                        "#f9fafb",
                      transition:
                        "background-color 0.2s",

                      "&:hover": {
                        backgroundColor:
                          "#f3f4f6",
                      },

                      "&.Mui-focused":
                        {
                          backgroundColor:
                            "#ffffff",
                        },
                    },
                }}
              />
            </Grid>

            {/* Sick Leave */}
            <Grid
              size={{ xs: 12, md: 6 }}
            >
              <TextField
                fullWidth
                type="number"
                label="Sick Leave"
                name="sickLeave"
                value={
                  form.sickLeave || 0
                }
                onChange={handleChange}
                variant="outlined"
                sx={{
                  "& .MuiOutlinedInput-root":
                    {
                      borderRadius:
                        "10px",
                      backgroundColor:
                        "#f9fafb",
                      transition:
                        "background-color 0.2s",

                      "&:hover": {
                        backgroundColor:
                          "#f3f4f6",
                      },

                      "&.Mui-focused":
                        {
                          backgroundColor:
                            "#ffffff",
                        },
                    },
                }}
              />
            </Grid>

            {/* Annual Leave */}
            <Grid
              size={{ xs: 12, md: 6 }}
            >
              <TextField
                fullWidth
                type="number"
                label="Annual Leave"
                name="annualLeave"
                value={
                  form.annualLeave || 0
                }
                onChange={handleChange}
                variant="outlined"
                sx={{
                  "& .MuiOutlinedInput-root":
                    {
                      borderRadius:
                        "10px",
                      backgroundColor:
                        "#f9fafb",
                      transition:
                        "background-color 0.2s",

                      "&:hover": {
                        backgroundColor:
                          "#f3f4f6",
                      },

                      "&.Mui-focused":
                        {
                          backgroundColor:
                            "#ffffff",
                        },
                    },
                }}
              />
            </Grid>

            {/* Submit Button */}
            <Grid size={{ xs: 12 }}>
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                fullWidth
                sx={{
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "#fff",
                  fontWeight: 600,
                  py: 1.5,
                  borderRadius:
                    "10px",
                  textTransform:
                    "none",
                  fontSize: "16px",
                  boxShadow:
                    "0 4px 15px rgba(102, 126, 234, 0.4)",
                  transition: "all 0.3s ease",

                  "&:hover": {
                    transform:
                      "translateY(-2px)",
                    boxShadow:
                      "0 6px 20px rgba(102, 126, 234, 0.6)",
                  },

                  "&:disabled": {
                    opacity: 0.7,
                  },
                }}
              >
                {loading
                  ? `${submitButtonText.replace(/[^a-zA-Z]/g, "")}...`
                  : submitButtonText}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </CardContent>
    </Card>
  );
}

// ========================================================================
// Example Usage:
// ========================================================================

/*
const [form, setForm] = useState({
  employeeId: "",
  employeeName: "",
  employeeEmail: "",
  department: "",
  designation: "",
  casualLeave: 8,
  sickLeave: 5,
  annualLeave: 12,
});

const handleFormChange = ({ name, value }) => {
  setForm(prev => ({ ...prev, [name]: value }));
};

<EmployeeForm
  form={form}
  onFormChange={handleFormChange}
  onSubmit={handleSubmit}
  loading={saving}
  error={error}
  onErrorClose={() => setError("")}
  submitButtonText="Add Employee"
  title="Add New Employee"
  isEditing={false}
  showIcon={true}
/>
*/