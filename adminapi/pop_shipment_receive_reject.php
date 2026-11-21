<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['request_id']) && isset($_POST['order_status']) && isset($_POST['distributor_id']))
{
	date_default_timezone_set('Asia/Calcutta');
	$da  = date("Y-m-d")." ".date('H:i:sa');
	$cdate=date("Y-m-d");
	$scri=date('H:i:sa');
	$temp_id=1;
	$id1=$_POST['request_id'];
	$remark=$_POST['remark'];
	$order_status=$_POST['order_status'];
	$distri_id=$_POST['distributor_id'];
	$toder = $_POST['total_order'];
	$json_a=json_decode($toder, true);     
	if($order_status=="Complete")
	{
		$res=mysqli_query($con,"select * from tbl_distributor_pop_request,tbl_purchase_party where tbl_distributor_pop_request.party_id =tbl_purchase_party.purchase_party_id and tbl_distributor_pop_request.request_id='$id1' and tbl_distributor_pop_request.distributor_id='$distri_id'");
		if(mysqli_num_rows($res)>0)
		{     
			while($fetch_product=mysqli_fetch_assoc($res))
			{
				$uniqueId1=$fetch_product['po_orderid'];
				$billno=$fetch_product['invoice_id'];
				$pp_id1=$fetch_product['purchase_party_id'];
				$pmode=$fetch_product['payment_mode'];
				$pmtype = $fetch_product['payment_type'];
				$cheque_bank = $fetch_product['bank_wallet_name'];
				$cheque_number = $fetch_product['payment_txn_id'];
				$cheque_date = $fetch_product['cheque_txn_date'];
				foreach ($json_a as $person_a)
				{
					$t_trans_id=$person_a['request_detail_id'];
					$proid=$person_a['product_id'];
					$pquanity=$person_a['quantity'];
					$temp_price=$person_a['updated_price'];
					$gst_perc=$person_a['gst_perc'];
					$total_pamt=$person_a['total_pamt'];
					$temp_cgst = isset($person_a['cgst_amt']) ? $person_a['cgst_amt'] : '';
					$temp_sgst = isset($person_a['sgst_amt']) ? $person_a['sgst_amt'] : '';
					$temp_igst = isset($person_a['igstamt']) ? $person_a['igstamt'] : '';
					$temp_cess=isset($person_a['cess_amount']) ? $person_a['cess_amount'] : '0';
					
					$uq1=mysqli_query($con,"update tbl_distributor_pop_request_detail set updated_qty='$pquanity' where request_detail_id='$t_trans_id'"); 
					$transaction_id = substr(uniqid(rand(),1),0,7).'_'.uniqid().'_'.substr(rand(),1,3);
					$query=mysqli_query($con,"INSERT IGNORE INTO tbl_distributor_transaction(transaction_id,product_id,distributor_id, quantity,transaction_date,transaction_time,txn_type,total_amount,cgst_amt,sgst_amt,party_id,bill_no,bill_date,bill_time,unique_bill,cess_amt,discount_amt,final_net_amt,remark_detail,igst_amt,product_price,payment_mode,payment_status,pay_amount,bank_wallet_name,payment_txn_id,cheque_txn_date,payment_type,gst_perc)values('$transaction_id','$proid','$distri_id','$pquanity','$cdate','$scri','Add','$total_pamt','$temp_cgst','$temp_sgst','$pp_id1','$billno','$cdate','$scri','$uniqueId1','$temp_cess','0','$total_pamt','$remark','$temp_igst','$temp_price','$pmode','Complete','$total_pamt','$cheque_bank','$cheque_number','$cheque_date','$pmtype','$gst_perc')");
					$res_result = mysqli_query($con,"select * from tbl_product where product_id='$proid'");
					while($fetch_product11=mysqli_fetch_assoc($res_result))
					{
						$temp_quantity_temp=$fetch_product11['stock_quantity'];
						$set_quan=round($temp_quantity_temp+$pquanity,2);
						$uq1=mysqli_query($con,"UPDATE tbl_product SET stock_quantity='$set_quan',tb_updatedatetime='$da' where product_id='$proid' and distributor_id='$distri_id'");
					}

					$res_stock = mysqli_query($con,"SELECT * FROM  tbl_distributor_stock where date ='$cdate' and distributor_id='$distri_id' and product_id='$proid' ORDER BY `date` DESC LIMIT 1");
					$row_stock =  mysqli_fetch_assoc($res_stock);
					if(mysqli_num_rows($res_stock)>0)
					{
						$stock_quantity=$row_stock['closing_stock'];
						$temp_quantity=round($stock_quantity+$pquanity,2);
						$uq=mysqli_query($con,"UPDATE tbl_distributor_stock SET closing_stock='$temp_quantity',time='$scri' where date ='$cdate' and distributor_id='$distri_id' and product_id='$proid'");	
					}
					else
					{
						$res_stock1 = mysqli_query($con,"SELECT * FROM  tbl_distributor_stock where date <='$cdate' and distributor_id='$distri_id' and product_id='$proid' ORDER BY `date` DESC LIMIT 1");
						$row_stock1 =  mysqli_fetch_assoc($res_stock1);
						if(mysqli_num_rows($res_stock1)>0)
						{
							$stock_quantity=$row_stock1['closing_stock'];
							$temp_quantity=round($stock_quantity+$pquanity,2);
							$stock_insert=mysqli_query($con,"INSERT IGNORE INTO tbl_distributor_stock(distributor_id,product_id,opening_stock,closing_stock,date,time)values('$distri_id','$proid','$stock_quantity','$temp_quantity','$cdate','$scri')");
						}
						else
						{
							$stock_insert=mysqli_query($con,"INSERT IGNORE INTO tbl_distributor_stock(distributor_id,product_id,opening_stock,closing_stock,date,time)values('$ver','$proid','0','$pquanity','$cdate','$scri')");
						}
					}
				}
			}
			$uq_update=mysqli_query($con,"update tbl_distributor_pop_request set order_status='Complete',shipment_received_datetime='$da',remark = '$remark' where request_id='$id1'"); 
			if($uq_update)
			{
				$response['success']='1';
				$response['details']="Shipment successfully done";
			}
			else
			{
				$response['success']='0';
				$response['details']="Shipment not done successfully.. Please check and try again later!!";
			}
		}
		else
		{
			$response['success']='0';
			$response['details']="Shipment not done successfully.. Please check and try again later!!";
		}
	}
	else
	{
		$uq_update=mysqli_query($con,"update tbl_distributor_pop_request set order_status='Reject',shipment_received_datetime='$da',remark = '$remark', reject_by='Distributor' where request_id='$id1'"); 
		$response['success']='1';
		$response['details']="Shipment successfully done";
	}
}
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);

?>