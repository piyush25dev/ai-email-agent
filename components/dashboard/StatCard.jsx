"use client";

import {
  Card,
  CardContent,
  Typography,
  Box,
} from "@mui/material";

export default function StatCard({
  title,
  value,
  icon,
  subtitle,
}) {
  return (
    <Card
      elevation={0}
      sx={{
        border: "1px solid #e5e7eb",
        borderRadius: 3,
        height: "100%",
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 2,
          }}
        >
          <Typography
            sx={{
              fontSize: 14,
              color: "#6b7280",
              fontWeight: 500,
            }}
          >
            {title}
          </Typography>

          {icon && (
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#f3f0ff",
                color: "#674D9F",
              }}
            >
              {icon}
            </Box>
          )}
        </Box>

        <Typography
          sx={{
            fontSize: 28,
            fontWeight: 700,
            color: "#1f2937",
            lineHeight: 1,
          }}
        >
          {value}
        </Typography>

        {subtitle && (
          <Typography
            sx={{
              mt: 1,
              fontSize: 12,
              color: "#9ca3af",
            }}
          >
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}