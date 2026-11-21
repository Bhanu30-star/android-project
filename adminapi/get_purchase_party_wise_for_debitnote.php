<?php
include("../../connect.php");
$response = array();
if (isset($_POST['party_id']) && isset($_POST['distributor_id']) && isset($_POST['start_date']) && isset($_POST['end_date'])) {
	$session_dist_ver = $_POST['distributor_id'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con, "SELECT country FROM tbl_distributor WHERE distributor_id='$session_dist_ver'");
	if (mysqli_num_rows($disSql) > 0) {
		$disRow = mysqli_fetch_array($disSql);
		if ($disRow['country'] == 'United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$da = date("Y-m-d");
	$start_date = $_POST['start_date'];
	$end_date = $_POST['end_date'];
	$final_party = $_POST['party_id'];
	$res1 = mysqli_query($con, "select serialno_configuration from tbl_distributor where distributor_id='$session_dist_ver'");
	while ($renew_fetch = mysqli_fetch_assoc($res1)) {
		$dis_ser_config = $renew_fetch['serialno_configuration'];
	}
	$response['serialno_configuration'] = $dis_ser_config;
	
	
	$bill_financial_year = mysqli_query($con, "SELECT * FROM `tbl_distributor_previous_data_record` WHERE start_date<='$start_date' && end_date>='$end_date'");
	if (mysqli_num_rows($bill_financial_year) > 0) {
		while ($f_data_fetch = mysqli_fetch_assoc($bill_financial_year)) {
			$extra_link1 = $f_data_fetch['purchase_txn_table'];
		}
	}
	$product_list = array();
	$result = mysqli_query($con, "SELECT * FROM `tbl_product` WHERE status='Active' AND distributor_id='$session_dist_ver' AND product_type NOT IN ('Payout','Money Payout','RET PAYOUT','BRANDING') AND product_id IN (select product_id FROM " . $extra_link1 . " WHERE party_id='$final_party')");
	if (mysqli_num_rows($result) > 0) 
	{
		while ($row = mysqli_fetch_array($result)) 
		{
			$proid=$row['product_id'];
			$product_list['product_id'] = $row['product_id'];
			$product_list['product_name'] = $row['product_name'];
			$product_list['product_type'] = $row['product_type'];
			$product_list['purchase_price'] = $row["purchase_price"];
			$product_list['purchase_price_exc'] = $row["purchase_price_exc"];
			$product_list['serial_type'] = $row['serial_type'];
			$product_list['decimal_category']=$row['decimal_category'];
			$product_list['CGST']=$row['CGST'];
			$product_list['SGST']=$row['SGST'];
			$product_list['IGST']=$row['IGST'];
			$product_list['cess_app']=$row['cess_applicable'];
			$product_list['cess_percentage']=$row['cess_percentage'];
			$product_list['maintain_inventory']=$row['maintain_inventory'];
			$product_list['serial_type']=$row['serial_type'];
			$product_list['data_type']=$row['data_type'];
			$product_list['unit']=$row['unit'];
			$product_list['secondary_unit']=$row['secondary_unit'];
			
			
			$product_list['new_quantity'] = 0;
			
			if ($row['serial_type'] == "Accessories" || $dis_ser_config == "Configure" || $row['product_type'] == 'Service' || $row['product_type'] == 'FMCG') 
			{
				$product_detail = mysqli_query($con, "SELECT closing_stock FROM `tbl_distributor_stock` WHERE date<='$da' AND distributor_id='$session_dist_ver' AND product_id='$proid' ORDER BY date DESC LIMIT 1");
				$tamt_closing = 0;
				if (mysqli_num_rows($product_detail) > 0) {
					$fetch_detail = mysqli_fetch_array($product_detail);
					$tamt_closing = $fetch_detail['closing_stock'];
				}
				$product_list['stock_qty'] = $tamt_closing;
				$product_list['new_quantity'] = 0;
				if ($row['maintain_inventory'] == "Yes") 
				{
					$total_sale_return_qty=0;
					$result_purchase=mysqli_query($con,"SELECT sum(".$extra_link1.".quantity) as finalqty FROM ".$extra_link1.",tbl_product WHERE ".$extra_link1.".product_id = tbl_product.product_id AND tbl_product.status='Active' AND tbl_product.distributor_id='$session_dist_ver' AND ".$extra_link1.".party_id='$final_party' AND tbl_product.product_id='$proid' GROUP BY ".$extra_link1.".product_id");
					$fetch_purchase_final = mysqli_fetch_assoc($result_purchase);
						
					$retailer_stock_return = mysqli_query($con, "SELECT SUM(quantity) AS return_qty FROM `tbl_party_debit_note` WHERE distributor_id='$session_dist_ver' AND purchase_party_id='$final_party' AND product_id='$proid' AND transaction_date>='$start_date'");
					if (mysqli_num_rows($retailer_stock_return) > 0) {
						while ($fetch_retailer_stock_return = mysqli_fetch_assoc($retailer_stock_return)) {
							$total_sale_return_qty += $fetch_retailer_stock_return['return_qty'];
						}
					}
					$product_list['new_quantity'] = $fetch_purchase_final['finalqty'] - $total_sale_return_qty;
				}
				$product_list['primary_bag_val'] = 0;
				$product_list['bag_list'] = [];
				$query_bag = mysqli_query($con, "SELECT primary_value,total_unit FROM `tbl_product_conversion_unit` WHERE product_id='$proid' AND status='Active' ORDER BY total_unit ASC");
				if (mysqli_num_rows($query_bag) > 0) {
					while ($results_bag = mysqli_fetch_assoc($query_bag)) {
						if ($results_bag['primary_value'] == 'Yes') {
							$product_list['primary_bag_val'] = $results_bag['total_unit'];
						}
						array_push($product_list['bag_list'], $results_bag);
					}
				}
			} 
			else
			{
				$product_list['check_disc_value'] = 'IMEI';
				$final_imei_qty = 0;
				$query_3 = mysqli_query($con, "SELECT * FROM `tbl_product` WHERE product_id='$proid' AND distributor_id='$session_dist_ver' AND status='Active' AND product_type='Serial No'");
				if (mysqli_num_rows($query_3) > 0) {
					$results_3 = mysqli_fetch_assoc($query_3);
					$product_check = mysqli_query($con, "SELECT sum(quantity) AS t_qty FROM `tbl_distributor_purchase_return_cart` WHERE product_id='$proid'");
					$fetch_product_checked = mysqli_fetch_assoc($product_check);
					$final_qty = $fetch_product_checked['t_qty'];
					$product_list['new_quantity'] = $results_3['stock_quantity'] - $final_qty;
				}
				$product_list['serial_no_list'] = [];
				$result = mysqli_query($con, "SELECT * FROM `tbl_product_serialno` WHERE product_id='$proid' AND status='Available' AND user_id='0' AND IMEI NOT IN (SELECT imei_no FROM `tbl_distributor_purchase_return_cart` WHERE distributor_id='$session_dist_ver' AND product_id='$proid') and unique_bill in (select unique_bill from ".$extra_link1." where product_id='$proid' and distributor_id='$session_dist_ver' and party_id='$final_party')");
				if (mysqli_num_rows($result) > 0) {
					foreach ($result as $value) {
						array_push($product_list['serial_no_list'], $value);
					}
				}
			}
			$response['product_list'][] = $product_list;
		}
		$response['success'] = '1';
		$response['details'] = "Detail fetched Successfully";
	} 
	else 
	{
		$response['product_list'] = $product_list;
		$response['success'] = '0';
		$response['details'] = "No Data Available";
	}
} else {
	$response['success'] = '0';
	$response['details'] = "Required field missing";
}
echo json_encode($response);
?>