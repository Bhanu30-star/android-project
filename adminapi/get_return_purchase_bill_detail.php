<?php
include("../../connect.php");
$response = array();
if(isset($_POST['party_id']) && isset($_POST['distributor_id']) && isset($_POST['distributor_user_id']) && isset($_POST['start_date']) && isset($_POST['end_date']))
{
	$dis_uid = $_POST['distributor_user_id'];
	$ver = $_POST['distributor_id'];
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
	$start_date = $_POST['start_date'];
	$end_date = $_POST['end_date'];
	
	$select_user=mysqli_query($con,"SELECT imei_no,session_id FROM tbl_distributor_users where status='Active' and distributor_user_id='$dis_uid'");
	if(mysqli_num_rows($select_user)>0)
	{     
		while($fetch_user=mysqli_fetch_array($select_user))
		{
			$response['user_status']='1';
			$response['user_imei']=$fetch_user['imei_no'];
			$response['session_id']=$fetch_user['session_id'];
		}
	}
	else
	{
		$response['user_status']='0';
		$response['session_id']='';
		$response['user_imei']='';
	}
	$pid=$_POST['party_id'];
	$res_search = mysqli_query($con,"select party_name from tbl_purchase_party where distributor_id='$ver' and purchase_party_id='$pid'");
	while($fetch_psearch=mysqli_fetch_assoc($res_search))
	{
		$partyName=$fetch_psearch['party_name'];
	}
	
	$purchasebook=array();
	$res = mysqli_query($con,"select unique_bill,bill_date,transaction_date,transaction_id,bill_time,bill_no,purchase_type,message_txn_id,bill_type from tbl_distributor_transaction where distributor_id='$ver' and party_id='$pid' and bill_date>='$start_date' AND bill_date<='$end_date' and txn_type='Add' and purchase_category!='Opening Stock' and conversion='' group by unique_bill");
	if(mysqli_num_rows($res)>0)
	{
		while($fetch_product=mysqli_fetch_assoc($res))
		{
			$purchasebook['party_name']=$partyName;
			$purchasebook['unique_bill']=$fetch_product['unique_bill'];
			$purchasebook['bill_number']=$fetch_product['bill_no'];
			$purchasebook['bill_date']=$fetch_product['bill_date'];
			$purchasebook['bill_time']=$fetch_product['bill_time'];
			$purchasebook['bill_type']=$fetch_product['bill_type'];
			$purchasebook['transaction_date']=$fetch_product['transaction_date'];
			$purchasebook['purchase_type']=$fetch_product['purchase_type'];
			$purchasebook['message_txn_id']=$fetch_product['message_txn_id'];
			
			$bill_date=$fetch_product['bill_date'];
			$u_bill=$fetch_product['unique_bill'];
			$bill_no=$fetch_product['bill_no'];
			
			$res_charges = mysqli_query($con,"select * from tbl_distributor_transaction_charges where distributor_id='$ver' and bill_date='$bill_date' and status='Complete' and unique_bill='$u_bill' and bill_no='$bill_no'");
			while($fetch_charges=mysqli_fetch_assoc($res_charges))
			{
				$purchasebook['labour_charges']=$fetch_charges['labour_charges'];
				$purchasebook['freight_charges']=$fetch_charges['freight_charges'];
				$purchasebook['other_expenses']=$fetch_charges['other_expenses'];
				$purchasebook['tcs_percentage']=$fetch_charges['tcs_percentage'];
				$purchasebook['is_tcs']=$fetch_charges['is_tcs'];
				$purchasebook['tcs_amt']=$fetch_charges['tcs_amt'];
				$purchasebook['disc_amt']=$fetch_charges['disc_amt'];
			}
			
			$purchasebook['purchasebookdetail']=array(); 
			
			$res11 = mysqli_query($con,"select *,tbl_distributor_transaction.product_price as pprice from tbl_distributor_transaction,tbl_product where tbl_distributor_transaction.product_id=tbl_product.product_id and tbl_distributor_transaction.distributor_id='$ver' and tbl_distributor_transaction.party_id='$pid' and tbl_distributor_transaction.bill_date='$bill_date' and tbl_distributor_transaction.txn_type='Add' and tbl_distributor_transaction.conversion='' and tbl_distributor_transaction.unique_bill='$u_bill' and tbl_distributor_transaction.bill_no='$bill_no'");
			while($fetch_product11=mysqli_fetch_assoc($res11))
			{
				$purchasebookdetail['transaction_id']=$fetch_product11['transaction_id'];
				$purchasebookdetail['quantity']=$fetch_product11['quantity'];
				$purchasebookdetail['bag_type']=$fetch_product11['bag_type'];
				$purchasebookdetail['bag_qty']=$fetch_product11['bag_qty'];
				$purchasebookdetail['free_qty']=$fetch_product11['free_qty'];
				$purchasebookdetail['amount']=round($fetch_product11['total_amount']);
				$purchasebookdetail['product_name']=$fetch_product11['product_name'];
				$purchasebookdetail['product_id']=$fetch_product11['product_id'];
				$purchasebookdetail['product_price']=$fetch_product11['pprice'];
				$purchasebookdetail['tcs_tds_applicable']=$fetch_product11['tcs_tds_applicable'];
				$purchasebookdetail['discount_amt']=$fetch_product11['discount_amt'];
				$purchasebookdetail['final_net_amt']=$fetch_product11['final_net_amt'];
				$purchasebookdetail['cgst_amt']=$fetch_product11['cgst_amt'];
				$purchasebookdetail['igst_amt']=$fetch_product11['igst_amt'];
				$purchasebookdetail['product_type']=$fetch_product11['product_type'];
				$purchasebookdetail['CGST']=$fetch_product11['CGST'];
				$purchasebookdetail['SGST']=$fetch_product11['SGST'];
				$purchasebookdetail['IGST']=$fetch_product11['IGST'];
				$purchasebookdetail['cess_amt']=$fetch_product11['cess_amt'];
				$purchasebookdetail['cess_pc_amt']=$fetch_product11['cess_pc_amt'];
				$purchasebookdetail['cess_percentage']=$fetch_product11['cess_percentage'];
				$purchasebookdetail['serial_type']=$fetch_product11['serial_type'];
				$purchasebookdetail['maintain_inventory']=$fetch_product11['maintain_inventory'];
				
				$purchasebookdetail['unit']=$fetch_product11['unit'];
				$purchasebookdetail['secondary_unit']=$fetch_product11['secondary_unit'];
				
				$res_conversiondetail=mysqli_query($con,"SELECT total_unit FROM tbl_product_conversion_unit WHERE product_id='".$fetch_product11['product_id']."' and status='Active' and primary_value ='Yes'");
				if(mysqli_num_rows($res_conversiondetail)>0)
				{
					while($fetch_consume=mysqli_fetch_assoc($res_conversiondetail))
					{
						$purchasebookdetail['primary_total_unit']= $fetch_consume['total_unit'];
					}
				}
				else
				{
					$purchasebookdetail['primary_total_unit']= '0';
				}
				
				$product_id=$fetch_product11['product_id'];
				if($fetch_product11['product_type']!="Payout")
				{
					$product= mysqli_query($con,"SELECT * FROM `tbl_product` WHERE `product_id`='$product_id'");
					while($pro_fetch=mysqli_fetch_array($product)) 
					{ 
						$purchasebookdetail['decimal_category']=$pro_fetch['decimal_category'];
						$purchasebookdetail['stock_quantity']=$pro_fetch['stock_quantity'];
						$purchasebookdetail['free_dist_stock']=$pro_fetch['free_stock'];
					}
				}
				else
				{
					$product= mysqli_query($con,"SELECT * FROM `tbl_product` WHERE `product_id`='$product_id'");
					while($pro_fetch=mysqli_fetch_array($product)) 
					{ 
						$purchasebookdetail['decimal_category']=$pro_fetch['decimal_category'];
					}
																
					$res_lapu = mysqli_query($con,"select * from tbl_product where status='Active' and distributor_id='$ver' and product_category='LAPU BALANCE'");
					while($fetch_LAPU=mysqli_fetch_assoc($res_lapu))
					{
						$purchasebookdetail['stock_quantity']=$fetch_LAPU['stock_quantity'];
					}	
				}
				$freeze_return=0;
				$month_gstr_check=explode("-",$bill_date);
				$query_check=mysqli_query($con,"select * from tbl_distributor_gst_report where distributor_id='$ver' and year='$month_gstr_check[0]' and month='$month_gstr_check[1]'");
				if(mysqli_num_rows($query_check)>0)
				{
					$freeze_return=1;
				}
				$purchasebookdetail['freeze_return']=$freeze_return;
				$temp_txn_id=$fetch_product11['transaction_id'];
				$return_quantity=0;
				$return_free_qty=0;
				$return_total_amount=0;
				$return_discount_amt=0;
				$return_final_amount=0;
				$return_bag_type=$return_bag_qty=0;
				
				$product_return= mysqli_query($con,"SELECT * FROM `tbl_purchase_return_transaction` WHERE `transaction_id`='$temp_txn_id'");
				while($pro_fetch_return=mysqli_fetch_array($product_return)) 
				{ 
					$return_bag_type=$return_bag_type+$pro_fetch_return['bag_type'];
					$return_bag_qty=$return_bag_qty+$pro_fetch_return['bag_qty'];
					$return_quantity=$return_quantity+$pro_fetch_return['return_quantity'];
					$return_free_qty=$return_free_qty+$pro_fetch_return['return_free_qty'];
					$return_total_amount=$return_total_amount+$pro_fetch_return['return_total_amount'];
					$return_discount_amt=$return_discount_amt+$pro_fetch_return['return_discount'];
					$return_final_amount=$return_final_amount+$pro_fetch_return['return_net_amt'];
				}
				$purchasebookdetail['return_bag_type']=$return_bag_type;
				$purchasebookdetail['return_bag_qty']=$return_bag_qty;
				$purchasebookdetail['return_quantity']=$return_quantity;
				$purchasebookdetail['return_free_qty']=$return_free_qty;
				$purchasebookdetail['return_total_amount']=$return_total_amount;
				$purchasebookdetail['return_discount_amt']=$return_discount_amt;
				$purchasebookdetail['return_final_amount']=$return_final_amount;
				$purchasebook['purchasebookdetail'][]=$purchasebookdetail;
			}
			$response['purchasebook'][]=$purchasebook;
		}
		$response['success']='1';
		$response['details']="Bill Successfully Fetch";
	}
	else
	{
		$response['success']='0';
		$response['details']="No Data Available";
	}
}
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);


?>