using System.Text.RegularExpressions;

namespace IAAS.Api.Infrastructure.Security;

public static partial class InputSanitizer
{
    public static string Sanitize(string? input)
    {
        if (string.IsNullOrEmpty(input)) return string.Empty;
        // Remove HTML tags
        var noHtml = HtmlTagRegex().Replace(input, "");
        // Remove script injections
        var noScript = ScriptRegex().Replace(noHtml, "");
        return noScript.Trim();
    }

    [GeneratedRegex("<[^>]*>")]
    private static partial Regex HtmlTagRegex();

    [GeneratedRegex(@"(javascript|on\w+)\s*[:=]", RegexOptions.IgnoreCase)]
    private static partial Regex ScriptRegex();
}
