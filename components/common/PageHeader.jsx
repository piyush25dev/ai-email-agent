import { Box, Button, Typography } from "@mui/material";
import GmailSyncButton from "./GmailSyncButton";

export function PageHeader({
    icon,
    title,
    subtitle,
    actions = [],
    showGmailSync = false,
    onGmailSyncComplete,
}) {
    return (
        <Box
            sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 2,
                mb: 4,
                flexWrap: "wrap",
            }}
        >
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                }}
            >
                {icon && (
                    <Box
                        sx={{
                            p: 1.5,
                            borderRadius: "12px",
                            background:
                                "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <Box sx={{ color: "#fff", display: "flex" }}>
                            {icon}
                        </Box>
                    </Box>
                )}

                <Box>
                    <Typography
                        variant="h4"
                        sx={{
                            fontWeight: 700,
                            color: "#1a1a2e",
                        }}
                    >
                        {title}
                    </Typography>

                    {subtitle && (
                        <Typography
                            variant="body2"
                            sx={{ color: "#6b7280" }}
                        >
                            {subtitle}
                        </Typography>
                    )}
                </Box>
            </Box>

            {(showGmailSync || actions.length > 0) && (
                <Box
                    sx={{
                        display: "flex",
                        gap: 1.5,
                        flexWrap: "wrap",
                    }}
                >
                    {showGmailSync && (
                        <GmailSyncButton
                            onSyncComplete={onGmailSyncComplete}
                        />
                    )}

                    {actions.map((action, index) => {
                        if (action.condition === false) return null;

                        return (
                            <Button
                                key={index}
                                variant={action.variant || "contained"}
                                startIcon={action.startIcon}
                                onClick={action.onClick}
                                size={action.size || "medium"}
                                disabled={action.disabled}
                            >
                                {action.label}
                            </Button>
                        );
                    })}
                </Box>
            )}
        </Box>
    );
}

export default PageHeader;