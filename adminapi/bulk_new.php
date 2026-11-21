<?php
include('../../connect.php');
error_reporting(0); 
mysqli_set_charset($con, 'utf8');
header('Content-Type: text/html; charset=utf-8');
$hindi_result = mysqli_query($con, "SET NAMES utf8");
$ver = (int) base64_decode($_GET['uid']);
require_once __DIR__ . '/../../mpdf-7.0.0/vendor/autoload.php';
$mpdf = new \Mpdf\Mpdf();
$stylesheet = file_get_contents('../../mpdf-7.0.0/css/style.css');
$ver = (int)$_GET['uid'];
$start_date = $_GET['sdate'];
$end_date = $_GET['edate'];
$bulkbilltype = $_GET['billtype'];
$billcopy = $_GET['billcopy'];
$lng = $_GET['lng'];
if ($bulkbilltype == "Invoice")
	$billtype = "Tax Invoice";
else if ($bulkbilltype == "Challan")
	$billtype = "Delivery Challan";
else if ($bulkbilltype == "Receipt")
	$billtype = "Receipt";
else $billtype = "Payout";
$party_place_id = '';
if ($_GET['searchparty'] != '') {
	$party_place_id = base64_decode($_GET['searchparty']);
}
$res_terms = mysqli_query($con, "select * from tbl_dist_terms_conditions where distributor_id='$ver'");
if (mysqli_num_rows($res_terms) > 0) {
	$a_terms = mysqli_fetch_array($res_terms);
	$tems_condtn1 = $a_terms['terms_condition1'];
	$tems_condtn2 = $a_terms['terms_condition2'];
	$tems_condtn3 = $a_terms['terms_condition3'];
	$tems_condtn4 = $a_terms['terms_condition4'];
	$tems_condtn5 = $a_terms['terms_condition5'];
	$tems_condtn6 = $a_terms['terms_condition6'];
	$tems_condtn7 = $a_terms['terms_condition7'];
} else {
	$tems_condtn1 = '';
	$tems_condtn2 = '';
	$tems_condtn3 = '';
	$tems_condtn4 = '';
	$tems_condtn5 = '';
	$tems_condtn6 = '';
	$tems_condtn7 = '';
}

$res_service = mysqli_query($con, "select food_license,credit_display,udyam_no,client_invoice_sign from tbl_client_service where distributor_id='$ver'");
$row_service = mysqli_fetch_array($res_service);
$client_foodlicense = $row_service['food_license'];
$client_credit_display = $row_service['credit_display'];
$client_udyamno = $row_service['udyam_no'];
$client_invoice_sign = $row_service['client_invoice_sign'];

$res_des = mysqli_query($con, "select * from tbl_distributor where distributor_id='$ver'");
$row_des = mysqli_num_rows($res_des);
$a = mysqli_fetch_array($res_des);
$client_gst_type = 'GST';
if ($row_des > 0) {
	if ($lng == 'hnd') {
		$user_name_dis = $a['distributor_name_hindi'];
		$distributor_address = $a['distributor_adrs_hindi'];
	} else {
		$user_name_dis = $a['distributor_name'];
		$distributor_address = $a['distributor_address'];
	}
	//$user_name_dis=$a['distributor_name'];
	$gstin_no_dis = $a['gstin_no'];
	$dis_image = $a['image_path'];
	$dis_QR_code = $a['QR_code'];
	$dis_operator = $a['operator'];
	$place_supply = $a['place_of_supply'];
	$dist_fabrics = $a['fabrics_receipt'];
	$dist_gst_config = $a['distributor_gst_configure'];
	//$distributor_address=$a['distributor_address'];
	$distributor_email = $a['distributor_email'];
	$business_description = $a['business_description'];
	$distributor_phone = $a['phone_no'];
	$distributor_mobile = $a['mobile_no'];
	if ($dis_image != '') {
		$temp_arr = explode(".", $dis_image);
		if ($temp_arr[1] == "")
			$dis_image = "";
	}
	$destination = "../distributor_logo/" . $dis_image;
	$currency_destination = $a['currency_value'];
	if ($a['country'] != "India")
		$client_gst_type = 'VAT';
	$code_no = $a['state_code'];
	$dis_bank = $a['bank_name'];
	$pan_no = $a['pan_no'];
	$account_no = $a['account_no'];
	$branch = $a['branch'];
	$ifsc_no = $a['ifsc_no'];
	$terms_of_delivery = $a['terms_of_delivery'];
	$prices = explode(" ", $terms_of_delivery);
	$term_delivery1 = "";
	$term_delivery2 = "";
	$term_delivery3 = "";
	$term_delivery4 = "";
	$term_delivery5 = "";
	$term_delivery6 = "";
	for ($i = 0; $i <= 6; $i++) {
		if (isset($prices[$i]))
			$term_delivery1 = $term_delivery1 . " " . $prices[$i];
	}
	for ($i = 7; $i <= 13; $i++) {
		if (isset($prices[$i]))
			$term_delivery2 = $term_delivery2 . " " . $prices[$i];
	}
	for ($i = 14; $i <= 20; $i++) {
		if (isset($prices[$i]))
			$term_delivery3 = $term_delivery3 . " " . $prices[$i];
	}
	for ($i = 21; $i < 27; $i++) {
		if (isset($prices[$i]))
			$term_delivery4 = $term_delivery4 . " " . $prices[$i];
	}
	for ($i = 28; $i < 34; $i++) {
		if (isset($prices[$i]))
			$term_delivery5 = $term_delivery5 . " " . $prices[$i];
	}
	for ($i = 35; $i < 41; $i++) {
		if (isset($prices[$i]))
			$term_delivery6 = $term_delivery6 . " " . $prices[$i];
	}
}

function hasSignature($imagePath, $threshold = 0.005)
{
	// Load image (handle remote URLs too)
	if (filter_var($imagePath, FILTER_VALIDATE_URL)) {
		$imgData = file_get_contents($imagePath);
		if ($imgData === false)
			return false;
		$img = @imagecreatefromstring($imgData);
	} else {
		if (!file_exists($imagePath))
			return false;
		$img = @imagecreatefrompng($imagePath);
	}

	if (!$img) {
		return false;
	}

	$width = imagesx($img);
	$height = imagesy($img);
	$totalPixels = $width * $height;
	$nonWhitePixels = 0;

	for ($x = 0; $x < $width; $x += 3) { // sample every 3 px for better accuracy
		for ($y = 0; $y < $height; $y += 3) {
			$rgba = imagecolorat($img, $x, $y);
			$r = ($rgba >> 16) & 0xFF;
			$g = ($rgba >> 8) & 0xFF;
			$b = $rgba & 0xFF;
			$a = ($rgba & 0x7F000000) >> 24; // alpha channel

			// Convert alpha (0 = opaque, 127 = transparent)
			$alpha = $a / 127.0;

			// If pixel is visible and not white
			if ($alpha < 0.9 && ($r < 240 || $g < 240 || $b < 240)) {
				$nonWhitePixels++;
			}
		}
	}

	imagedestroy($img);

	// Adjust sample count since we skipped pixels
	$ratio = $nonWhitePixels / (($totalPixels) / 9);

	// If more than threshold non-white pixels → likely signature
	return $ratio > $threshold;
}

function indian_number_format($num)
{
	$num = (string) $num;
	$last3 = substr($num, -3);
	$restUnits = substr($num, 0, -3);
	if ($restUnits != '') {
		$restUnits = preg_replace("/\B(?=(\d{2})+(?!\d))/", ",", $restUnits);
		$formatted = $restUnits . "," . $last3;
	} else {
		$formatted = $last3;
	}
	return $formatted;
}

function numberToWords($num)
{
	$ones = array(
		0 => "Zero",
		1 => "One",
		2 => "Two",
		3 => "Three",
		4 => "Four",
		5 => "Five",
		6 => "Six",
		7 => "Seven",
		8 => "Eight",
		9 => "Nine",
		10 => "Ten",
		11 => "Eleven",
		12 => "Twelve",
		13 => "Thirteen",
		14 => "Fourteen",
		15 => "Fifteen",
		16 => "Sixteen",
		17 => "Seventeen",
		18 => "Eighteen",
		19 => "Nineteen",
		20 => "Twenty",
		30 => "Thirty",
		40 => "Forty",
		50 => "Fifty",
		60 => "Sixty",
		70 => "Seventy",
		80 => "Eighty",
		90 => "Ninety"
	);

	$tens = array("", "Ten", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety");
	$hundreds = array("", "Hundred", "Thousand", "Lakh", "Crore");

	$num = number_format($num, 2, ".", ""); // 2 decimal
	$splitNum = explode(".", $num);
	$rupees = (int) $splitNum[0];
	$paise = (int) $splitNum[1];

	$convertNumber = function ($n) use ($ones) {
		if ($n < 21) {
			return $ones[$n];
		} elseif ($n < 100) {
			return $ones[10 * floor($n / 10)] . (($n % 10 > 0) ? " " . $ones[$n % 10] : "");
		} elseif ($n < 1000) {
			return $ones[floor($n / 100)] . " Hundred" . (($n % 100 > 0) ? " " . $this->convertNumber($n % 100) : "");
		}
	};

	// Rupees convert
	$words = ucfirst(trim(convert_number_to_words($rupees))) . " Rupees";

	// Paise convert
	if ($paise > 0) {
		$words .= " and " . ucfirst(trim(convert_number_to_words($paise))) . " Paise";
	}

	return $words;
}

// Helper function for big numbers (Indian format)
function convert_number_to_words($number)
{
	$hyphen = ' ';
	$conjunction = ' and ';
	$separator = ' ';
	$negative = 'negative ';
	$decimal = ' point ';
	$dictionary = array(
		0 => 'Zero',
		1 => 'One',
		2 => 'Two',
		3 => 'Three',
		4 => 'Four',
		5 => 'Five',
		6 => 'Six',
		7 => 'Seven',
		8 => 'Eight',
		9 => 'Nine',
		10 => 'Ten',
		11 => 'Eleven',
		12 => 'Twelve',
		13 => 'Thirteen',
		14 => 'Fourteen',
		15 => 'Fifteen',
		16 => 'Sixteen',
		17 => 'Seventeen',
		18 => 'Eighteen',
		19 => 'Nineteen',
		20 => 'Twenty',
		30 => 'Thirty',
		40 => 'Forty',
		50 => 'Fifty',
		60 => 'Sixty',
		70 => 'Seventy',
		80 => 'Eighty',
		90 => 'Ninety',
		100 => 'Hundred',
		1000 => 'Thousand',
		100000 => 'Lakh',
		10000000 => 'Crore'
	);

	if (!is_numeric($number)) {
		return false;
	}

	if (($number >= 0 && (int) $number < 0) || (int) $number < 0 - PHP_INT_MAX) {
		// overflow
		trigger_error(
			'convert_number_to_words only accepts numbers between -' . PHP_INT_MAX . ' and ' . PHP_INT_MAX,
			E_USER_WARNING
		);
		return false;
	}

	if ($number < 0) {
		return $negative . convert_number_to_words(abs($number));
	}

	$string = $fraction = null;

	if (strpos($number, '.') !== false) {
		list($number, $fraction) = explode('.', $number);
	}

	switch (true) {
		case $number < 21:
			$string = $dictionary[$number];
			break;
		case $number < 100:
			$tens = ((int) ($number / 10)) * 10;
			$units = $number % 10;
			$string = $dictionary[$tens];
			if ($units) {
				$string .= $hyphen . $dictionary[$units];
			}
			break;
		case $number < 1000:
			$hundreds = $number / 100;
			$remainder = $number % 100;
			$string = $dictionary[$hundreds] . ' ' . $dictionary[100];
			if ($remainder) {
				$string .= $conjunction . convert_number_to_words($remainder);
			}
			break;
		case $number < 100000:
			$thousands = $number / 1000;
			$remainder = $number % 1000;
			$string = convert_number_to_words($thousands) . ' ' . $dictionary[1000];
			if ($remainder) {
				$string .= $separator . convert_number_to_words($remainder);
			}
			break;
		case $number < 10000000:
			$lakhs = $number / 100000;
			$remainder = $number % 100000;
			$string = convert_number_to_words($lakhs) . ' ' . $dictionary[100000];
			if ($remainder) {
				$string .= $separator . convert_number_to_words($remainder);
			}
			break;
		default:
			$crores = $number / 10000000;
			$remainder = $number % 10000000;
			$string = convert_number_to_words($crores) . ' ' . $dictionary[10000000];
			if ($remainder) {
				$string .= $separator . convert_number_to_words($remainder);
			}
			break;
	}

	return $string;
}


$bill_financial_year = mysqli_query($con, "SELECT * FROM tbl_distributor_previous_data_record where start_date <='$start_date' and end_date >='$end_date'");
while ($f_data_fetch = mysqli_fetch_assoc($bill_financial_year)) {
	$extra_link1 = $f_data_fetch['txn_table'];
	$extra_link2 = $f_data_fetch['txn_detail_table'];
}

$mpdf = new \Mpdf\Mpdf();
$mpdf->AliasNbPages();

$res_check = "select transaction_id,serial_no_bill,transaction_bill_number,payment_mode,payment_status from " . $extra_link1 . " where transaction_date>='$start_date' and transaction_date<='$end_date' and transaction_from in (select user_id from tbl_user where `distributor_id` = '$ver') and bill_type='$billtype'";
if ($party_place_id != "") {
	$res_check = $res_check . " " . "and transaction_to in ($party_place_id)";
}
if ($sbillno != "") {
	$res_check = $res_check . " " . "and transaction_bill_number like '%$sbillno%'";
}
$res_check = $res_check . " " . "order by transaction_bill_number asc";
$res_txn_receipt = mysqli_query($con, $res_check);

$res_watermark = mysqli_query($con, "select * from tbl_client_service where distributor_id='$ver' and Mode_watermark='Yes'");

if (mysqli_num_rows($res_txn_receipt) == 0) {
	echo "<script> alert('There is no invoices'); window.close(); </script>";
} else if (mysqli_num_rows($res_txn_receipt) <= 200) {
	$start_bill = 0;
	while ($fetch_txn_receipt = mysqli_fetch_assoc($res_txn_receipt)) {
		if (mysqli_num_rows($res_watermark) > 0) {
			$destination_inv_pu = "../distributor_logo/paid-021-1.png";
			if ($fetch_txn_receipt['payment_mode'] == 'Credit') {
				if ($fetch_txn_receipt['payment_status'] != 'Complete') {
					$destination_inv_pu = "distributor_logo/unpaid-022-1.png";
				}
			}
		}
		if ($start_bill == 0)
			$start_bill_invoice = $fetch_txn_receipt['transaction_bill_number'];
		$mpdf->AddPage();
		$tid = $fetch_txn_receipt['transaction_id'];
		$start_bill++;
		if ($billtype == "Receipt") {

			$mpdf->WriteHTML($stylesheet, 1);
			ob_start();
			include '../download_bulk_invoice_content_1.php';
			$content11 = ob_get_clean();
			$mpdf->SetDisplayMode('fullpage');
			$mpdf->WriteHTML($content11);
			$mpdf->SetHTMLFooter('<div style="width: 100%;margin: 0 auto; margin-left: 5%; margin-right: 5%;">
				<table style="width: 700px;">
					<tbody>
						<tr>
							<td>&nbsp;</td>
							<td class="right">Powered by Zucol</td>
						</tr>
					</tbody>
				</table>
			</div>');
		} else {
			$check_bill_type = mysqli_query($con, "select transaction_id from " . $extra_link2 . ",tbl_product where " . $extra_link2 . ".product_id=tbl_product.product_id and " . $extra_link2 . ".transaction_id='$tid' and tbl_product.product_type='FMCG'");
			if (mysqli_num_rows($check_bill_type) > 0) {
				$stylesheet = file_get_contents('mpdf-7.0.0/css/style.css');
				$mpdf->WriteHTML($stylesheet, 1);
				ob_start();
				if (mysqli_num_rows($res_watermark) > 0) {
					$mpdf->SetWatermarkImage($destination_inv_pu, 0.7, '', [130, 45]);
					$mpdf->showWatermarkImage = true; // Enable watermark image display
				}
				include '../download_bulk_invoice_content_FMCG_2.php';
				$content12 = ob_get_clean();
				$mpdf->SetDisplayMode('fullpage');
				$mpdf->WriteHTML($content12);
				$mpdf->SetHTMLFooter('<div style="width: 100%;margin: 0 auto; margin-left: 5%; margin-right: 5%;">
					<table style="width: 700px;">
						<tbody>
							<tr>
								<td>&nbsp;</td>
								<td class="right">Powered by Zucol</td>
							</tr>
						</tbody>
					</table>
				</div>');
			} else {
				$mpdf->WriteHTML($stylesheet, 1);
				ob_start();
				if (mysqli_num_rows($res_watermark) > 0) {
					$mpdf->SetWatermarkImage($destination_inv_pu, 0.7, '', [130, 45]);
					$mpdf->showWatermarkImage = true; // Enable watermark image display
				}
				include '../download_bulk_invoice_content_serailno_3.php';
				$content13 = ob_get_clean();
				$mpdf->SetDisplayMode('fullpage');
				$mpdf->WriteHTML($content13);
				$mpdf->SetHTMLFooter('<div style="width: 100%;margin: 0 auto; margin-left: 5%; margin-right: 5%;">
							<table style="width: 700px;">
								<tbody>
									<tr>
										<td>&nbsp;</td>
										<td class="right">Powered by Zucol</td>
									</tr>
								</tbody>
							</table>
						</div>');
			}
		}
	}
	$mpdf->Output('Invoices"' . $start_bill_invoice . ' - ' . $transaction_bill_number . '".pdf', 'I');
} else {
	echo "<script> alert('There are too many invoices therefore system takes time to download, kindly download data for single retailer or less than 30 days!!'); 
	window.close(); </script>";
}
