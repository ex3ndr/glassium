import { View } from "react-native";

export default function Privacy() {
    return (
        <View style={{ flexGrow: 1 }}>
            <div
                dangerouslySetInnerHTML={{
                    __html: `
                <div name="termly-embed" data-id="a77dbfd8-20d7-42ca-9e3c-7779f1c24459"></div>
                <script type="text/javascript">(function(d, s, id) {
      var js, tjs = d.getElementsByTagName(s)[0];
                    if (d.getElementById(id)) return;
                    js = d.createElement(s); js.id = id;
                    js.src = "https://app.termly.io/embed-policy.min.js";
                    tjs.parentNode.insertBefore(js, tjs);
    }(document, 'script', 'termly-jssdk'));</script>
            `}} />
        </View>
    )
}