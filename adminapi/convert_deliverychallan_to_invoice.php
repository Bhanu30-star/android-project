<?php    
include("../../connect.php"); 
$response = array();
if(isset($_POST['txn_id']) && isset($_POST['distributor_id']))
{
	$ver = $_POST["distributor_id"];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$ver'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$scro = date("h:i:s");
	$da  = date("Y-m-d");
	$scri =$da." ".$scro;
	$temp_date2=strtotime($da);
	$id1=$_POST['txn_id'];
	$p_mode=$_POST['payment_mode'];
	$c_amt=$_POST['cash_amount'];
	$p_status=$_POST['payment_status'];
	$converted_id1 = isset($_POST['convert_id']) ? $_POST['convert_id'] : '';
	$txn22='';
	$month_arr=array("Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec");
	$month_arr_temp=array("J","K","L","A","B","C","D","E","F","G","H","I");
	$curre_month=date("M",$temp_date2);
	for($gh=0;$gh<count($month_arr);$gh++)
	{
			if($month_arr[$gh]==$curre_month)
			{
				$temp_string=$month_arr_temp[$gh];
			}
	}
	$temp_explode="";
	$select_order=mysqli_query($con,"select recent_sequence from `tbl_sequence` where distributor_id='$ver'");
	$select_row =  mysqli_fetch_assoc($select_order);
	if(mysqli_num_rows($select_order)>0)
	{
			$temp=$select_row['recent_sequence'];
			$check_seq=mysqli_query($con,"select bill_sequence from `tbl_distributor` where distributor_id='$ver'");
			$select_seq =  mysqli_fetch_assoc($check_seq);
			if($select_seq['bill_sequence']=="Standard")
			{
				if($temp_string==$temp[0])
				{
					$final_invoice=(int)substr($temp,1);
					$final_invoice=$final_invoice+1;
					$final_invoice1=(string)$final_invoice;
					$string_count=5-(int)strlen($final_invoice1);
					for($vb=0;$vb<$string_count;$vb++)
					{
						$temp_explode=$temp_explode."0";
					}
					$sd=$temp_string.$temp_explode.$final_invoice;
				}
				else
				{
					$sd=$temp_string."00001";
				}
			}
			else
			{
				$temp_explode=substr($temp,0,2);
				$final_invoice=(int)substr($temp,2);
				$final_invoice=$final_invoice+1;
				$sd=$temp_explode.$final_invoice;
			}
			$uq_sequence=mysqli_query($con,"UPDATE tbl_sequence SET recent_sequence='$sd',last_update_datetime='$scri' where distributor_id='$ver'");
	}
	else
	{
			$sd=$temp_string."00001";
			$uq_sequence =mysqli_query($con,"insert into tbl_sequence(distributor_id,recent_sequence,last_update_datetime)values('$ver','$sd','$scri')");
	}	
	if($uq_sequence)
	{
		$res = mysqli_query($con,"select * from tbl_party_transaction where transaction_id='$id1'");
		while($fetch_product=mysqli_fetch_assoc($res))
		{
			$transaction_id = substr(uniqid(rand(),1),0,7).'_'.uniqid().'_'.substr(rand(),1,3);
			$stock_insert=mysqli_query($con,"INSERT INTO `tbl_party_transaction`(`transaction_id`,`transaction_bill_number`, `transaction_date`, `transaction_time`, `transaction_from`, `transaction_to`, `party_gstin`, `total_amount`, `round_off_amt`, `disc_amt`, `tds_amt`, `cess_amount`, `final_amt`, `labour_charges`, `freight_charges`, `other_expenses`, `bill_discount_percentage`, `bill_cgst`, `bill_sgst`, `bill_igst`, `payment_mode`, `payment_status`, `credit_days`, `bank_name`, `cheque_no`, `cheque_date`, `supply_place`, `reverse_charge`, `cash_amount`, `cheque_amount`, `invoice_receipt`, `remark`, `cash_receipt_date`, `bill_type`, `converted_transaction_id`, `txn_id`, `bill_date`, `serial_no_bill`, `consignee_name`, `transport_company`, `g_r_no`, `transport_date`, `transport_address`, `reason`, `reason_datetime`, `latitude`, `longitude`, `courier_facility`, `courier_no`, `message_txn_id`, `reference_no`, `courier_date`, `courier_company`, `transaction_bill_type`, `generated_by`,`payment_type`,`online_amt`,`source`,`sign_image`,`txn_service_type`, `gst_configure`, `bill_mode`) VALUES ('$transaction_id','$sd','$da','$scro','".$fetch_product['transaction_from']."','".$fetch_product['transaction_to']."','".$fetch_product['party_gstin']."','".$fetch_product['total_amount']."','".$fetch_product['round_off_amt']."','".$fetch_product['disc_amt']."','".$fetch_product['tds_amt']."','".$fetch_product['cess_amount']."','".$fetch_product['final_amt']."','".$fetch_product['labour_charges']."','".$fetch_product['freight_charges']."','".$fetch_product['other_expenses']."','".$fetch_product['bill_discount_percentage']."','".$fetch_product['bill_cgst']."','".$fetch_product['bill_sgst']."','".$fetch_product['bill_igst']."','".$p_mode."','".$p_status."','".$fetch_product['credit_days']."','".$fetch_product['bank_name']."','".$fetch_product['cheque_no']."','".$fetch_product['cheque_date']."','".$fetch_product['supply_place']."','".$fetch_product['reverse_charge']."','".$c_amt."','".$fetch_product['cheque_amount']."','".$fetch_product['invoice_receipt']."','".$fetch_product['remark']."','".$fetch_product['cash_receipt_date']."','Tax Invoice','$id1','".$fetch_product['txn_id']."','".$fetch_product['bill_date']."','".$fetch_product['serial_no_bill']."','".$fetch_product['consignee_name']."','".$fetch_product['transport_company']."','".$fetch_product['g_r_no']."','".$fetch_product['transport_date']."','".$fetch_product['transport_address']."','".$fetch_product['reason']."','".$fetch_product['reason_datetime']."','".$fetch_product['latitude']."','".$fetch_product['longitude']."','".$fetch_product['courier_facility']."','".$fetch_product['courier_no']."','".$fetch_product['message_txn_id']."','".$fetch_product['reference_no']."','".$fetch_product['courier_date']."','".$fetch_product['courier_company']."','".$fetch_product['transaction_bill_type']."','".$fetch_product['generated_by']."','".$fetch_product['payment_type']."','".$fetch_product['online_amt']."','Admin','".$fetch_product['sign_image']."','".$fetch_product['txn_service_type']."','".$fetch_product['gst_configure']."','".$fetch_product['bill_mode']."')");
			$re = mysqli_insert_id($con);
			if($p_status=='Partial Completed')
			{
				$uq=mysqli_query($con,"UPDATE tbl_receipt_transaction SET transaction_id='$transaction_id',converted_id='$converted_id1' where transaction_id ='$id1'");
			}
			$update_result = mysqli_query($con,"select * from tbl_party_transaction_detail where transaction_id='$id1'");
			while($fetch_update=mysqli_fetch_assoc($update_result))
			{
				$stock_insert1=mysqli_query($con,"INSERT INTO `tbl_party_transaction_detail`(`transaction_id`, `product_id`, `product_name`, `product_name_hindi`, `product_price`, `MRP`, `quantity`, `total_bag`, `actual_quantity`, `IMEI_NO`, `product_disc`, `CGST_amount`, `SGST_amount`, `IGST_amount`, `discount_type`, `discount_percentage`, `cess_pc_amt`, `cess_percentage`, `cess_final_amt`, `gst_perc`, `product_total_amt`, `taxable_amount`, `batch_no`, `expiry_date`, `adjust_stock`, `packing`, `bag_type`, `bag_qty`, `free_qty`, `consume_detail`) VALUES ('$transaction_id','".$fetch_update['product_id']."','".$fetch_update['product_name']."','".$fetch_update['product_name_hindi']."','".$fetch_update['product_price']."','".$fetch_update['MRP']."','".$fetch_update['quantity']."','".$fetch_update['total_bag']."','".$fetch_update['actual_quantity']."','".$fetch_update['IMEI_NO']."','".$fetch_update['product_disc']."','".$fetch_update['CGST_amount']."','".$fetch_update['SGST_amount']."','".$fetch_update['IGST_amount']."','".$fetch_update['discount_type']."','".$fetch_update['discount_percentage']."','".$fetch_update['cess_pc_amt']."','".$fetch_update['cess_percentage']."','".$fetch_update['cess_final_amt']."','".$fetch_update['gst_perc']."','".$fetch_update['product_total_amt']."','".$fetch_update['taxable_amount']."','".$fetch_update['batch_no']."','".$fetch_update['expiry_date']."','".$fetch_update['adjust_stock']."','".$fetch_update['packing']."','".$fetch_update['bag_type']."','".$fetch_update['bag_qty']."','".$fetch_update['free_qty']."','".$fetch_update['consume_detail']."')");
			}
			if($stock_insert && $stock_insert1)
			{
				$uq=mysqli_query($con,"UPDATE tbl_party_transaction SET payment_status='Converted',converted_date='$da' where transaction_id ='$id1'");
				$response['success']=1;
				$response['details']=$sd;
			}
			// $action_history = mysqli_query($con, "INSERT INTO `tbl_btcw_bthawk_access_logs` (`client_id`, `action_name`, `action_at`, `action_from`, `ip_address`, `inserted_at`, `updated_at`) VALUES ('$session_dist_ver', 'INSERT+UPDATE OPERATION,Converting Delivery Challan to Invoice#Admin(INSERT+UPDATE)tbl_party_transaction,tbl_party_transaction_detail,tbl_receipt_transaction,tbl_sequence', current_timestamp(), 'App', '$ipaddress', current_timestamp(), '0000-00-00 00:00:00.000000')");
		}
	}
	else
	{
		$response['success']=0;
		$response['details']="Insertion Error...!!";
	}
}
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);
 ?>