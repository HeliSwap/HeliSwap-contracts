export namespace Utils {

	const TEN_MINUTES = 600_000;

	export function getExpiry() {
		return (new Date()).getTime() + TEN_MINUTES;
	}
}