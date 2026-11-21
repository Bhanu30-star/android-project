<?php
include("../../connect.php");
$response = array();
if (isset($_POST['party_id']) && isset($_POST['distributor_id']) && isset($_POST['start_date']) && isset($_POST['end_date'])) {
	$ver = $_POST['distributor_id'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con, "SELECT country FROM tbl_distributor WHERE distributor_id='$ver'");
	if (mysqli_num_rows($disSql) > 0) {
		$disRow = mysqli_fetch_array($disSql);
		if ($disRow['country'] == 'United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$scro = date("h:i:s");
	$da  = date("Y-m-d");
	$scri = $da . " " . $scro;
	$start_date = $_POST['start_date'];
	$end_date = $_POST['end_date'];
	$pid = $_POST['party_id'];
	$flagData = 0;
	$res_search = mysqli_query($con, "select party_name from tbl_purchase_party where distributor_id='$ver' and purchase_party_id='$pid'");
	while ($fetch_psearch = mysqli_fetch_assoc($res_search)) {
		$partyName = $fetch_psearch['party_name'];
	}
	$purchasebook = array();
	if ($pid > 0) {
		$res = mysqli_query($con, "select *,sum(tbl_distributor_transaction.final_net_amt) as finalamt,sum(tbl_distributor_transaction.pay_amount) as finalpay_amt from tbl_distributor_transaction,tbl_product where tbl_distributor_transaction.product_id = tbl_product.product_id and tbl_distributor_transaction.distributor_id='$ver' and tbl_distributor_transaction.party_id='$pid' and tbl_distributor_transaction.bill_date>='$start_date' AND tbl_distributor_transaction.bill_date<='$end_date' and tbl_distributor_transaction.txn_type='Add' and tbl_distributor_transaction.purchase_category!='Opening Stock' and tbl_distributor_transaction.conversion='' and tbl_product.product_type!='BRANDING' group by tbl_distributor_transaction.unique_bill,tbl_distributor_transaction.bill_no");
	} else {
		$res = mysqli_query($con, "select *,sum(tbl_distributor_transaction.final_net_amt) as finalamt,sum(tbl_distributor_transaction.pay_amount) as finalpay_amt from tbl_distributor_transaction,tbl_product where tbl_distributor_transaction.product_id = tbl_product.product_id and tbl_distributor_transaction.distributor_id='$ver' and  tbl_distributor_transaction.bill_date>='$start_date' AND tbl_distributor_transaction.bill_date<='$end_date' and tbl_distributor_transaction.txn_type='Add' and tbl_distributor_transaction.purchase_category!='Opening Stock' and tbl_distributor_transaction.conversion='' and tbl_product.product_type!='BRANDING' group by tbl_distributor_transaction.unique_bill, tbl_distributor_transaction.bill_no");
	}
	if (mysqli_num_rows($res) > 0) {
		while ($fetch_product = mysqli_fetch_assoc($res)) {
			$pid = $fetch_product['party_id'];
			$res_search = mysqli_query($con, "select party_name,place_of_supply from tbl_purchase_party where distributor_id='$ver' and purchase_party_id='$pid'");
			$fetch_psearch = mysqli_fetch_assoc($res_search);
			$purchasebook['party_id'] = $pid;
			$purchasebook['party_name'] = $fetch_psearch['party_name'];
			$purchasebook['place_of_supply'] = $fetch_psearch['place_of_supply'];
			$purchasebook['unique_bill'] = $fetch_product['unique_bill'];
			$purchasebook['bill_number'] = $fetch_product['bill_no'];
			$purchasebook['bill_date'] = $fetch_product['bill_date'];
			$purchasebook['bill_time'] = $fetch_product['bill_time'];
			$purchasebook['bill_type'] = $fetch_product['bill_type'];
			$purchasebook['sale_type'] = $fetch_product['payment_mode'];
			$purchasebook['transaction_date'] = $fetch_product['transaction_date'];
			$purchasebook['purchase_type'] = $fetch_product['purchase_type'];
			$purchasebook['message_txn_id'] = $fetch_product['message_txn_id'];
			$purchasebook['finalpay_amt'] = $fetch_product['finalpay_amt'];
			$bill_date = $fetch_product['bill_date'];
			$u_bill = $fetch_product['unique_bill'];
			$bill_no = $fetch_product['bill_no'];
			$purchasebook['finalamt'] = $fetch_product['finalamt'];
			$transaction_date = $fetch_product['transaction_date'];
			$res_charges = mysqli_query($con, "select * from tbl_distributor_transaction_charges where distributor_id='$ver' and bill_date='$bill_date' and status='Complete' and unique_bill='$u_bill' and bill_no='$bill_no'");
			while ($fetch_charges = mysqli_fetch_assoc($res_charges)) {
				$purchasebook['labour_charges'] = $fetch_charges['labour_charges'];
				$purchasebook['freight_charges'] = $fetch_charges['freight_charges'];
				$purchasebook['other_expenses'] = $fetch_charges['other_expenses'];
				$purchasebook['tcs_percentage'] = $fetch_charges['tcs_percentage'];
				$purchasebook['is_tcs'] = $fetch_charges['is_tcs'];
				$purchasebook['tcs_amt'] = $fetch_charges['tcs_amt'];
				$purchasebook['disc_amt'] = $fetch_charges['disc_amt'];
				$purchasebook['finalamt'] = $fetch_charges['net_amt'];
			}
			$freeze_return = 0;
			$return_flag = 0;
			$month_gstr_check = explode("-", $bill_date);
			$query_check = mysqli_query($con, "select * from tbl_distributor_gst_report where distributor_id='$ver' and year='$month_gstr_check[0]' and month='$month_gstr_check[1]'");
			if (mysqli_num_rows($query_check) > 0) {
				$freeze_return = 1;
			}
			$purchasebook['freeze_return'] = $freeze_return;
			$product_return = mysqli_query($con, "SELECT * FROM `tbl_purchase_return_transaction` WHERE unique_bill='$u_bill' and bill_no='$bill_no' and party_id='$pid'");
			if (mysqli_num_rows($product_return) > 0) {
				$return_flag = 1;
			}
			$purchasebook['purchase_return_flag'] = $return_flag;
			$purchasebook['distributor_stock_less'] = 'False';
			$res_detail = mysqli_query($con, "select product_id,quantity from tbl_distributor_transaction where distributor_id='$ver' and party_id='$pid' and unique_bill='$u_bill' and txn_type='Add'");
			while ($fetch_proDetail = mysqli_fetch_assoc($res_detail)) {
				$txn_productId = $fetch_proDetail['product_id'];
				$purchaseQuantity = $fetch_proDetail['quantity'];
				$resstock_detail = mysqli_query($con, "select tbl_distributor_stock.closing_stock,tbl_product.product_type from tbl_distributor_stock,tbl_product where tbl_distributor_stock.product_id=tbl_product.product_id and tbl_distributor_stock.distributor_id='$ver' and tbl_distributor_stock.product_id='$txn_productId' and tbl_distributor_stock.date>='$transaction_date' and tbl_product.product_type not in ('Payout','Money Payout')");
				while ($fetch_stockDetail = mysqli_fetch_assoc($resstock_detail)) {
					if ($fetch_stockDetail['closing_stock'] < $purchaseQuantity)
						$purchasebook['distributor_stock_less'] = 'True';
				}
			}
			$purchasebook['purchasebookdetail'] = array();
			$res11 = mysqli_query($con, "select *,tbl_distributor_transaction.product_price as pprice from tbl_distributor_transaction,tbl_product where tbl_distributor_transaction.product_id=tbl_product.product_id and tbl_distributor_transaction.distributor_id='$ver' and tbl_distributor_transaction.party_id='$pid' and tbl_distributor_transaction.bill_date='$bill_date' and tbl_distributor_transaction.unique_bill='$u_bill' and tbl_distributor_transaction.bill_no='$bill_no'");
			while ($fetch_product11 = mysqli_fetch_assoc($res11)) 
			{
				$purchasebookdetail['transaction_id'] = $fetch_product11['transaction_id'];
				$purchasebookdetail['quantity'] = $fetch_product11['quantity'];
				$purchasebookdetail['bag_type'] = $fetch_product11['bag_type'];
				$purchasebookdetail['bag_qty'] = $fetch_product11['bag_qty'];
				$purchasebookdetail['amount'] = (string)round($fetch_product11['total_amount']);
				$purchasebookdetail['free_qty'] = $fetch_product11['free_qty'];
				$purchasebookdetail['product_name'] = $fetch_product11['product_name'];
				$purchasebookdetail['product_id'] = $fetch_product11['product_id'];
				$purchasebookdetail['product_type'] = $fetch_product11['product_type'];
				$purchasebookdetail['product_price'] = $fetch_product11['pprice'];
				$purchasebookdetail['discount_amt'] = $fetch_product11['discount_amt'];
				$purchasebookdetail['final_net_amt'] = $fetch_product11['final_net_amt'];
				$purchasebookdetail['tcs_tds_applicable'] = $fetch_product11['tcs_tds_applicable'];
				$purchasebookdetail['cgst_amt'] = $fetch_product11['cgst_amt'];
				$purchasebookdetail['sgst_amt'] = $fetch_product11['sgst_amt'];
				$purchasebookdetail['igst_amt'] = $fetch_product11['igst_amt'];
				$purchasebookdetail['product_type'] = $fetch_product11['product_type'];
				$purchasebookdetail['CGST'] = $fetch_product11['CGST'];
				$purchasebookdetail['SGST'] = $fetch_product11['SGST'];
				$purchasebookdetail['IGST'] = $fetch_product11['IGST'];
				$purchasebookdetail['cess_amt'] = $fetch_product11['cess_amt'];
				$purchasebookdetail['cess_pc_amt'] = $fetch_product11['cess_pc_amt'];
				$purchasebookdetail['cess_percentage'] = $fetch_product11['cess_percentage'];
				$purchasebookdetail['decimal_category'] = $fetch_product11['decimal_category'];
				$purchasebookdetail['maintain_inventory'] = $fetch_product11['maintain_inventory'];
				$purchasebookdetail['serial_type'] = $fetch_product11['serial_type'];
				$purchasebookdetail['unit'] = $fetch_product11['unit'];
				$purchasebookdetail['secondary_unit'] = $fetch_product11['secondary_unit'];
				$res_conversiondetail = mysqli_query($con, "SELECT total_unit FROM tbl_product_conversion_unit WHERE product_id='" . $fetch_product11['product_id'] . "' and status='Active' and primary_value ='Yes'");
				if (mysqli_num_rows($res_conversiondetail) > 0) {
					while ($fetch_consume = mysqli_fetch_assoc($res_conversiondetail)) {
						$purchasebookdetail['primary_total_unit'] = $fetch_consume['total_unit'];
					}
				} else {
					$purchasebookdetail['primary_total_unit'] = '0';
				}
				$product_id = $fetch_product11['product_id'];
				
				$imei_product_detail=array();
				$purchasebookdetail['imei_product_detail']=array();
				
				$res_imeidetail = mysqli_query($con,"select * from tbl_product_serialno where product_id = '$product_id'"); 
				if(mysqli_num_rows($res_imeidetail)>0)
				{
					while($fetch_imei=mysqli_fetch_assoc($res_imeidetail))
					{
						$imei_product_detail['stock_id']=$fetch_imei['stock_id'];
						$imei_product_detail['IMEI']= $fetch_imei['IMEI'];
						$imei_product_detail['status']= $fetch_imei['status'];
						if($fetch_imei['unique_bill']==$u_bill)
							$imei_product_detail['purchase_bill']= 'Yes';
						else
							$imei_product_detail['purchase_bill']= 'No';
						$purchasebookdetail['imei_product_detail'][]=$imei_product_detail;
					}
				}
				else
				{
					$purchasebookdetail['imei_product_detail']=$imei_product_detail;
				}
				
				
				
				if ($fetch_product11['product_type'] != "Payout") {
					$product = mysqli_query($con, "SELECT * FROM `tbl_product` WHERE `product_id`='$product_id'");
					while ($pro_fetch = mysqli_fetch_array($product)) {
						$purchasebookdetail['stock_quantity'] = $pro_fetch['stock_quantity'];
						$purchasebookdetail['free_dist_stock'] = $pro_fetch['free_stock'];
					}
				} else {
					$res_lapu = mysqli_query($con, "select * from tbl_product where status='Active' and distributor_id='$ver' and product_category='LAPU BALANCE'");
					while ($fetch_LAPU = mysqli_fetch_assoc($res_lapu)) {
						$purchasebookdetail['stock_quantity'] = $fetch_LAPU['stock_quantity'];
					}
				}
				$freeze_return = 0;
				$month_gstr_check = explode("-", $bill_date);
				$query_check = mysqli_query($con, "select * from tbl_distributor_gst_report where distributor_id='$ver' and year='$month_gstr_check[0]' and month='$month_gstr_check[1]'");
				if (mysqli_num_rows($query_check) > 0) {
					$freeze_return = 1;
				}
				$purchasebookdetail['freeze_return'] = $freeze_return;
				$temp_txn_id = $fetch_product11['transaction_id'];
				$return_quantity = 0;
				$return_free_qty = 0;
				$return_total_amount = 0;
				$return_discount_amt = 0;
				$return_final_amount = 0;
				$return_bag_type = $return_bag_qty = 0;
				$product_return = mysqli_query($con, "SELECT * FROM `tbl_purchase_return_transaction` WHERE `transaction_id`='$temp_txn_id'");
				while ($pro_fetch_return = mysqli_fetch_array($product_return)) {
					$return_bag_type = $return_bag_type + $pro_fetch_return['bag_type'];
					$return_bag_qty = $return_bag_qty + $pro_fetch_return['bag_qty'];
					$return_quantity = $return_quantity + $pro_fetch_return['return_quantity'];
					$return_free_qty = $return_free_qty + $pro_fetch_return['return_free_qty'];
					$return_total_amount = $return_total_amount + $pro_fetch_return['return_total_amount'];
					$return_discount_amt = $return_discount_amt + $pro_fetch_return['return_discount'];
					$return_final_amount = $return_final_amount + $pro_fetch_return['return_net_amt'];
				}
				$purchasebookdetail['return_bag_type'] = $return_bag_type;
				$purchasebookdetail['return_bag_qty'] = $return_bag_qty;
				$purchasebookdetail['return_quantity'] = $return_quantity;
				$purchasebookdetail['return_free_qty'] = $return_free_qty;
				$purchasebookdetail['return_total_amount'] = (string)$return_total_amount;
				$purchasebookdetail['return_discount_amt'] = (string)$return_discount_amt;
				$purchasebookdetail['return_final_amount'] = (string)$return_final_amount;
				$purchasebook['purchasebookdetail'][] = $purchasebookdetail;
			}
			$response['purchasebook'][] = $purchasebook;
		}
		$res_day_end = mysqli_query($con, "select * from tbl_distributor_business_control where distributor_id='$ver' and insert_date='$da'");
		if (mysqli_num_rows($res_day_end) > 0)
			$response['dist_day_end'] = '1';
		else
			$response['dist_day_end'] = '0';
		$response['success'] = '1';
		$response['details'] = "Bill fetched Successfully";
	} else {
		$response['success'] = '0';
		$response['details'] = "No Data Available";
	}
} else {
	$response['success'] = '0';
	$response['details'] = "Required field missing";
}
echo json_encode($response);