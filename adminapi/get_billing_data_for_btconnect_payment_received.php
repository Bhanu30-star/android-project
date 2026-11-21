<?php
include("../../connect.php");
$response = array();
if(isset($_POST['type']) && isset($_POST['panno']) &&  isset($_POST['gstinno']))
{
	date_default_timezone_set('Asia/Calcutta');
	$clientIP = $_SERVER['REMOTE_ADDR'];
	$apiUrl = "http://ipinfo.io/{$clientIP}/json";
	$response1 = file_get_contents($apiUrl);
	$details = json_decode($response1, true);
	if($details['country']=='AE')
	{
		date_default_timezone_set('Asia/Dubai');
	}
	$da  = date("Y-m-d");
	$fetch_type = $_POST['type'];
	$panno_for_bthawk = trim($_POST['panno']);
	$gstin_for_bthawk = trim($_POST['gstinno']);
	$billing_month = $_POST['billing_month'];
	$download_flag_val = $_POST['download_flag'];
	
	if($fetch_type=='GSTIN')
	{
		$result_state = mysqli_query($con, "SELECT * from tbl_distributor where gstin_no='$gstin_for_bthawk'");
		$fetch_state = mysqli_fetch_array($result_state);
		$ver=$fetch_state['distributor_id'];
	}
	else if($fetch_type=='PANNO')
	{
		$result_state = mysqli_query($con, "SELECT * from tbl_distributor where pan_no='$panno_for_bthawk' limit 1");
		$fetch_state = mysqli_fetch_array($result_state);
		$ver=$fetch_state['distributor_id'];
	}
	if($ver>0)
	{
		$cdate1 = $billing_month.'-01';
		$cdate2 = date('Y-m-t', strtotime($cdate1));
		
		$newDate_1 = date('Y-m-01', strtotime('-1 month', strtotime($billing_month . '-01')));
		$newDate_2 = date('Y-m-t', strtotime('-1 month', strtotime($billing_month . '-01')));
		
		$res = mysqli_query($con,"select * from tbl_party_transaction,tbl_party,tbl_user where tbl_party_transaction.transaction_to=tbl_party.party_id and tbl_party_transaction.transaction_from =tbl_user.user_id and tbl_party_transaction.transaction_date>='$newDate_1' and tbl_party_transaction.transaction_date<='$newDate_2' and tbl_user.distributor_id='$ver' and tbl_party_transaction.download_flag in ('0000-00-00','$cdate2') order by tbl_party_transaction.id asc");
		$billbook=array();
		if(mysqli_num_rows($res)>0)
		{     
			while($fetch_product=mysqli_fetch_assoc($res))
			{
				$transaction_id=$fetch_product['transaction_id'];
				$billbook['transaction_id']=$fetch_product['transaction_id'];
				$billbook['invoice_number']=$fetch_product['transaction_bill_number'];
				$billbook['transaction_date']=$fetch_product['transaction_date'];
				$billbook['transaction_time']=$fetch_product['transaction_time'];
				$billbook['party_id']=$fetch_product['party_id'];
				$billbook['party_name']=$fetch_product['party_name'];
				$billbook['party_phone']=$fetch_product['party_phone'];
				$billbook['party_gstin']=$fetch_product['party_gstin'];
				$billbook['place_supply']=$fetch_product['place_of_supply'];
				$billbook['party_code']=$fetch_product['party_code'];
				$billbook['total_amount']=$fetch_product['total_amount'];
				$billbook['final_amount']=$fetch_product['final_amt'];
				$billbook['payment_mode']=$fetch_product['payment_mode'];
				$billbook['gst_configure']=$fetch_product['gst_configure'];
				$billbook['round_off_amt']=$fetch_product['round_off_amt'];
				$billbook['utr_no']=$fetch_product['cheque_no'];
				$billbook['download_flag']=$fetch_product['download_flag'];
				$billbook['bank_name']=$fetch_product['bank_name'];
				$utrnoval=$fetch_product['cheque_no'];
				$msgtxnid=$fetch_product['message_txn_id'];
				if($fetch_product['message_txn_id']>0)
				{
					$res_message_1 = mysqli_query($con,"select * from tbl_btcw_distributor_fees_transactions where utr='$utrnoval' and fees_txn_id='$msgtxnid'");  
					if(mysqli_num_rows($res_message_1)>0)
					{	
						while($fetch_date=mysqli_fetch_assoc($res_message_1))
						{
							$distid=$fetch_date['distributor_id'];
							$res_message_2 = mysqli_query($con,"SELECT admin.admin_name FROM tbl_gstr_detail as chart, tbl_admin_panel as admin WHERE chart.distributor_id='$distid' AND chart.Status='Assign' AND admin.admin_id = chart.admin_id");  
							if(mysqli_num_rows($res_message_2)>0)
							{	
								while($fetch_date=mysqli_fetch_assoc($res_message_2))
								{
									$billbook['chartered_name']=$fetch_date['admin_name'];
								}
							}
						}
					}
				}
				else
				{
					$billbook['chartered_name']='';
				}
				
				
				$res_consumedetail = mysqli_query($con,"select *,tbl_party_transaction_detail.product_price as pro_price from tbl_party_transaction_detail,tbl_product where tbl_party_transaction_detail.product_id = tbl_product.product_id and tbl_party_transaction_detail.transaction_id='$transaction_id'"); 
				if(mysqli_num_rows($res_consumedetail)>0)
				{
					while($fetch_consume=mysqli_fetch_assoc($res_consumedetail))
					{
						$billbook['product_name']= $fetch_consume['product_name'];
						$billbook['quantity']=$fetch_consume['quantity'];
						$billbook['product_price']= $fetch_consume['pro_price'];
						$billbook['CGST_amount']=$fetch_consume['CGST_amount'];
						$billbook['SGST_amount']= $fetch_consume['SGST_amount'];
						$billbook['IGST_amount']=$fetch_consume['IGST_amount'];
						$billbook['pur_total_amt']=$fetch_consume['product_total_amt'];
						$billbook['gst_perc']=$fetch_consume['gst_perc'];
						$billbook['taxable_amount']=$fetch_consume['taxable_amount'];
						$billbook['hsn_code']=$fetch_consume['hsn_code'];
						$billbook['primary_unit']=$fetch_consume['unit'];
					}
				}
				$response['billbook'][]=$billbook;
			}
			if($download_flag_val=='Yes')
			{
				mysqli_query($con, "UPDATE tbl_party_transaction JOIN tbl_user ON tbl_party_transaction.transaction_from = tbl_user.user_id JOIN tbl_party ON tbl_party_transaction.transaction_to = tbl_party.party_id SET tbl_party_transaction.download_flag = '$cdate2' WHERE tbl_party_transaction.transaction_date >= '$newDate_1' AND tbl_party_transaction.transaction_date <= '$newDate_2' AND tbl_user.distributor_id = '$ver' and tbl_party_transaction.download_flag='0000-00-00'");
				
			}
		}
			
			
		$res1 = mysqli_query($con,"select * from tbl_party_transaction,tbl_party,tbl_user where tbl_party_transaction.transaction_to=tbl_party.party_id and tbl_party_transaction.transaction_from =tbl_user.user_id and tbl_party_transaction.transaction_date>='$cdate1' and tbl_party_transaction.transaction_date<='$cdate2' and tbl_user.distributor_id='$ver' and tbl_party_transaction.download_flag in ('0000-00-00','$cdate2') order by tbl_party_transaction.id asc");
		if(mysqli_num_rows($res1)>0)
		{     
			while($fetch_product=mysqli_fetch_assoc($res1))
			{
				$transaction_id=$fetch_product['transaction_id'];
				$billbook['transaction_id']=$fetch_product['transaction_id'];
				$billbook['invoice_number']=$fetch_product['transaction_bill_number'];
				$billbook['transaction_date']=$fetch_product['transaction_date'];
				$billbook['transaction_time']=$fetch_product['transaction_time'];
				$billbook['party_id']=$fetch_product['party_id'];
				$billbook['party_name']=$fetch_product['party_name'];
				$billbook['party_phone']=$fetch_product['party_phone'];
				$billbook['party_gstin']=$fetch_product['party_gstin'];
				$billbook['place_supply']=$fetch_product['place_of_supply'];
				$billbook['party_code']=$fetch_product['party_code'];
				$billbook['total_amount']=$fetch_product['total_amount'];
				$billbook['final_amount']=$fetch_product['final_amt'];
				$billbook['payment_mode']=$fetch_product['payment_mode'];
				$billbook['gst_configure']=$fetch_product['gst_configure'];
				$billbook['round_off_amt']=$fetch_product['round_off_amt'];
				$billbook['utr_no']=$fetch_product['cheque_no'];
				$billbook['download_flag']=$fetch_product['download_flag'];
				$billbook['bank_name']=$fetch_product['bank_name'];
				$utrnoval=$fetch_product['cheque_no'];
				$msgtxnid=$fetch_product['message_txn_id'];
				if($fetch_product['message_txn_id']>0)
				{
					$res_message_1 = mysqli_query($con,"select * from tbl_btcw_distributor_fees_transactions where utr='$utrnoval' and fees_txn_id='$msgtxnid'");  
					if(mysqli_num_rows($res_message_1)>0)
					{	
						while($fetch_date=mysqli_fetch_assoc($res_message_1))
						{
							$distid=$fetch_date['distributor_id'];
							$res_message_2 = mysqli_query($con,"SELECT admin.admin_name FROM tbl_gstr_detail as chart, tbl_admin_panel as admin WHERE chart.distributor_id='$distid' AND chart.Status='Assign' AND admin.admin_id = chart.admin_id");  
							if(mysqli_num_rows($res_message_2)>0)
							{	
								while($fetch_date=mysqli_fetch_assoc($res_message_2))
								{
									$billbook['chartered_name']=$fetch_date['admin_name'];
								}
							}
						}
					}
				}
				else
				{
					$billbook['chartered_name']='';
				}
				
				
				$res_consumedetail = mysqli_query($con,"select *,tbl_party_transaction_detail.product_price as pro_price from tbl_party_transaction_detail,tbl_product where tbl_party_transaction_detail.product_id = tbl_product.product_id and tbl_party_transaction_detail.transaction_id='$transaction_id'"); 
				if(mysqli_num_rows($res_consumedetail)>0)
				{
					while($fetch_consume=mysqli_fetch_assoc($res_consumedetail))
					{
						$billbook['product_name']= $fetch_consume['product_name'];
						$billbook['quantity']=$fetch_consume['quantity'];
						$billbook['product_price']= $fetch_consume['pro_price'];
						$billbook['CGST_amount']=$fetch_consume['CGST_amount'];
						$billbook['SGST_amount']= $fetch_consume['SGST_amount'];
						$billbook['IGST_amount']=$fetch_consume['IGST_amount'];
						$billbook['pur_total_amt']=$fetch_consume['product_total_amt'];
						$billbook['gst_perc']=$fetch_consume['gst_perc'];
						$billbook['taxable_amount']=$fetch_consume['taxable_amount'];
						$billbook['hsn_code']=$fetch_consume['hsn_code'];
						$billbook['primary_unit']=$fetch_consume['unit'];
					}
				}
				$response['billbook'][]=$billbook;
			}
			if($download_flag_val=='Yes')
			{
				mysqli_query($con, "UPDATE tbl_party_transaction JOIN tbl_user ON tbl_party_transaction.transaction_from = tbl_user.user_id JOIN tbl_party ON tbl_party_transaction.transaction_to = tbl_party.party_id SET tbl_party_transaction.download_flag = '$cdate2' WHERE tbl_party_transaction.transaction_date >= '$cdate1' AND tbl_party_transaction.transaction_date <= '$cdate2' AND tbl_user.distributor_id = '$ver' and tbl_party_transaction.download_flag='0000-00-00'");
				
			}
		}	
			
			
		$response['success']='1';
		$response['message']="Fetch Detail Successful";
			
		
	}
	else
	{
		$response['success']='0';
		$response['message']="PANNO or GSTIN NO not Correct!!";
	}
}		
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);

?>